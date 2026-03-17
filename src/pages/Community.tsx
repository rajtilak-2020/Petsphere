import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadFile } from '../supabase';
import { motion } from 'motion/react';
import { MessageCircle, Heart, Send, ImagePlus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ImageCropper } from '../components/ImageCropper';

export const Community = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [newPostContent, setNewPostContent] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPostIds(new Set(data.map((l: any) => l.post_id)));
  };

  useEffect(() => {
    fetchPosts();
    fetchUserLikes();
    const ch = supabase.channel('posts-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newPostContent.trim()) return;
    setUploading(true);
    try {
      let photo_url = null;
      if (photoFile) photo_url = await uploadFile('posts', photoFile);
      const { error } = await supabase.from('posts').insert({ author_id: user.id, author_name: profile.name, content: newPostContent, likes_count: 0, photo_url });
      if (!error) { setNewPostContent(''); setPhotoFile(null); fetchPosts(); }
    } finally { setUploading(false); }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const alreadyLiked = likedPostIds.has(postId);

    if (alreadyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.rpc('decrement_like', { p_post_id: postId });
      setLikedPostIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      await supabase.rpc('increment_like', { p_post_id: postId });
      setLikedPostIds(prev => new Set(prev).add(postId));
    }
    fetchPosts();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRawFile(f);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-gray-400 text-sm mt-1 mb-4">Share updates and connect with fellow pet lovers</p>
      </div>

      {rawFile && <ImageCropper file={rawFile} onCrop={(f) => { setPhotoFile(f); setRawFile(null); }} onCancel={() => setRawFile(null)} />}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 flex-shrink-0">
        <form onSubmit={handlePost}>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                {profile?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <textarea rows={2} className="input-dark w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                placeholder="Share an update about your pet..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            </div>
          </div>
          {photoFile && (
            <div className="mt-3 ml-14 relative inline-block">
              <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
              <button type="button" onClick={() => setPhotoFile(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex justify-between items-center mt-3 ml-14">
            <label className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-400 cursor-pointer transition-colors">
              <ImagePlus className="h-4 w-4" /> Photo
              <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
            </label>
            <button type="submit" disabled={!newPostContent.trim() || uploading}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="-ml-0.5 mr-1.5 h-4 w-4" /> {uploading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mt-4 pr-1">
        {posts.map((post, i) => {
          const isLiked = likedPostIds.has(post.id);
          return (
            <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass rounded-xl">
              <div className="p-5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {post.author_name.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{post.author_name}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-300 leading-relaxed"><p>{post.content}</p></div>
                {post.photo_url && (
                  <div className="mt-3 rounded-lg overflow-hidden aspect-square">
                    <img src={post.photo_url} alt="Post" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-white/[0.05]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors group ${isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                  >
                    <Heart className={`h-4 w-4 group-hover:scale-110 transition-transform ${isLiked ? 'fill-red-400' : ''}`} />
                    <span>{post.likes_count}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-16 glass rounded-xl">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-3 text-sm font-medium text-gray-300">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500">Be the first to share an update!</p>
          </div>
        )}
      </div>
    </div>
  );
};
