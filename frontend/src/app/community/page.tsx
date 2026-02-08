"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
    Plus,
    Search,
    Heart,
    MessageSquare,
    Edit2,
    Trash2,
    X,
    Send,
    Loader2,
    ImageIcon,
    ArrowLeft,
    MoreVertical,
    Clock,
    MapPin,
    User,
    Filter,
    SortAsc,
} from "lucide-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    communityService,
    CommunityPost,
    CommunityReply,
    PostType,
    POST_TYPE_LABELS,
    POST_TYPE_COLORS,
    formatRelativeTime,
} from "@/services/community"
import {
    validateImageFile,
    createImagePreview as createPreviewUrl,
    revokeImagePreview,
    uploadImage,
    formatFileSize,
    UploadError,
} from "@/lib/upload"

// Sort options
type SortOption = 'recent' | 'upvotes' | 'replies';

const SORT_OPTIONS: Record<SortOption, string> = {
    recent: 'Most Recent',
    upvotes: 'Most Upvoted',
    replies: 'Most Replies',
};

// Get current user ID from localStorage
function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const user = localStorage.getItem('user');
        if (user) {
            const parsed = JSON.parse(user);
            return parsed.id || null;
        }
    } catch {
        return null;
    }
    return null;
}

// Check if user is logged in
function isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
}

export default function CommunityPage() {
    // State
    const [posts, setPosts] = useState<CommunityPost[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [activeTab, setActiveTab] = useState<PostType | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('recent')

    // Create post
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [createTitle, setCreateTitle] = useState('')
    const [createContent, setCreateContent] = useState('')
    const [createCategory, setCreateCategory] = useState<PostType>('discussion')
    const [createImage, setCreateImage] = useState<File | null>(null)
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // Post detail
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
    const [showPostDetail, setShowPostDetail] = useState(false)
    const [replies, setReplies] = useState<CommunityReply[]>([])
    const [loadingReplies, setLoadingReplies] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [isReplying, setIsReplying] = useState(false)

    // Edit post
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editContent, setEditContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    // Delete confirmation
    const [deleteConfirmPost, setDeleteConfirmPost] = useState<CommunityPost | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Toast/notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const currentUserId = getCurrentUserId()

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Fetch posts
    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            let fetchedPosts: CommunityPost[] = []

            if (searchQuery.trim()) {
                // Search posts
                fetchedPosts = await communityService.searchPosts(searchQuery.trim())
            } else if (activeTab !== 'all') {
                // Filter by type
                fetchedPosts = await communityService.getPostsByType(activeTab)
            } else {
                // Get all posts
                const response = await communityService.getPosts({ limit: 100 })
                fetchedPosts = response.items
            }

            // Sort posts
            fetchedPosts = sortPosts(fetchedPosts, sortBy)

            setPosts(fetchedPosts)
        } catch (err) {
            console.error('Failed to fetch posts:', err)
            setError('Failed to load posts. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [activeTab, searchQuery, sortBy])

    // Sort posts helper
    const sortPosts = (postsToSort: CommunityPost[], sort: SortOption): CommunityPost[] => {
        return [...postsToSort].sort((a, b) => {
            switch (sort) {
                case 'upvotes':
                    return b.likes_count - a.likes_count
                case 'replies':
                    return b.replies_count - a.replies_count
                case 'recent':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })
    }

    // Load posts on mount and filter change
    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate using upload utility
            const validationError = validateImageFile(file)
            if (validationError) {
                showToast(validationError.message, 'error')
                return
            }
            setCreateImage(file)
            setCreateImagePreview(createPreviewUrl(file))
        }
    }

    // Clear image
    const clearImage = () => {
        setCreateImage(null)
        if (createImagePreview) {
            revokeImagePreview(createImagePreview)
        }
        setCreateImagePreview(null)
    }

    // Create post
    const handleCreatePost = async () => {
        const errors: Record<string, string> = {}

        if (!createTitle.trim()) {
            errors.title = "Title is required"
        } else if (createTitle.length < 3 || createTitle.length > 200) {
            errors.title = "Title must be between 3 and 200 characters"
        }

        if (!createContent.trim()) {
            errors.content = "Content is required"
        } else if (createContent.length < 10 || createContent.length > 2000) {
            errors.content = "Content must be between 10 and 2000 characters"
        }

        setFormErrors(errors)

        if (Object.keys(errors).length > 0) {
            showToast('Please fix the errors before posting', 'error')
            return
        }

        try {
            setIsCreating(true)

            // Upload image first if selected
            let imageUrl: string | undefined
            if (createImage) {
                try {
                    imageUrl = await uploadImage(createImage)
                } catch (uploadErr) {
                    const error = uploadErr as UploadError
                    // If upload fails, warn but continue (image upload is optional)
                    console.warn('Image upload failed:', error.message)
                    showToast(`Image upload failed: ${error.message}. Post will be created without image.`, 'error')
                }
            }

            const newPost = await communityService.createPost({
                title: createTitle.trim(),
                content: createContent.trim(),
                post_type: createCategory,
                // TODO: Pass image_url when backend supports it
                // image_url: imageUrl,
            })
            setPosts(prev => [newPost, ...prev])
            setShowCreateForm(false)
            setCreateTitle('')
            setCreateContent('')
            setCreateCategory('discussion')
            setFormErrors({})
            clearImage()
            showToast('Post created successfully!')
        } catch (err) {
            console.error('Failed to create post:', err)
            showToast('Failed to create post. Please try again.', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    // Cancel create
    const handleCancelCreate = () => {
        setShowCreateForm(false)
        setCreateTitle('')
        setCreateContent('')
        setCreateCategory('discussion')
        setFormErrors({})
        clearImage()
    }

    // Open post detail
    const openPostDetail = async (post: CommunityPost) => {
        setSelectedPost(post)
        setShowPostDetail(true)
        setReplies([])
        setLoadingReplies(true)

        // Try to fetch replies (backend may not have this endpoint yet)
        try {
            const fetchedReplies = await communityService.getReplies(post.id)
            setReplies(fetchedReplies)
        } catch {
            // Silently fail - replies endpoint may not exist
            console.log('Replies endpoint not available')
        } finally {
            setLoadingReplies(false)
        }
    }

    // Close post detail
    const closePostDetail = () => {
        setShowPostDetail(false)
        setSelectedPost(null)
        setReplies([])
        setReplyContent('')
    }

    // Handle upvote toggle
    const handleUpvote = async (post: CommunityPost, e?: React.MouseEvent) => {
        e?.stopPropagation()

        if (!isLoggedIn()) {
            showToast('Please log in to upvote', 'error')
            return
        }

        // Optimistic update
        const wasLiked = post.user_has_liked
        const updatedPost = {
            ...post,
            user_has_liked: !wasLiked,
            likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1,
        }

        setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p))
        if (selectedPost?.id === post.id) {
            setSelectedPost(updatedPost)
        }

        try {
            if (wasLiked) {
                await communityService.removeUpvote(post.id)
            } else {
                await communityService.upvotePost(post.id)
            }
        } catch (err) {
            // Revert on error
            setPosts(prev => prev.map(p => p.id === post.id ? post : p))
            if (selectedPost?.id === post.id) {
                setSelectedPost(post)
            }
            showToast('Failed to update vote', 'error')
        }
    }

    // Add reply
    const handleAddReply = async () => {
        if (!selectedPost || !replyContent.trim()) return

        if (!isLoggedIn()) {
            showToast('Please log in to reply', 'error')
            return
        }

        try {
            setIsReplying(true)
            const newReply = await communityService.addReply(selectedPost.id, replyContent.trim())
            setReplies(prev => [...prev, newReply])
            setReplyContent('')

            // Update reply count
            const updatedPost = {
                ...selectedPost,
                replies_count: selectedPost.replies_count + 1,
            }
            setSelectedPost(updatedPost)
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p))

            showToast('Reply added!')
        } catch (err) {
            console.error('Failed to add reply:', err)
            showToast('Failed to add reply. Please try again.', 'error')
        } finally {
            setIsReplying(false)
        }
    }

    // Open edit dialog
    const openEditDialog = (post: CommunityPost, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setEditingPost(post)
        setEditTitle(post.title)
        setEditContent(post.content)
    }

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingPost) return

        if (!editTitle.trim() || !editContent.trim()) {
            showToast('Please fill in all required fields', 'error')
            return
        }

        try {
            setIsEditing(true)
            const updatedPost = await communityService.updatePost(editingPost.id, {
                title: editTitle.trim(),
                content: editContent.trim(),
            })
            setPosts(prev => prev.map(p => p.id === editingPost.id ? updatedPost : p))
            if (selectedPost?.id === editingPost.id) {
                setSelectedPost(updatedPost)
            }
            setEditingPost(null)
            showToast('Post updated!')
        } catch (err) {
            console.error('Failed to update post:', err)
            showToast('Failed to update post. Please try again.', 'error')
        } finally {
            setIsEditing(false)
        }
    }

    // Open delete confirmation
    const openDeleteConfirm = (post: CommunityPost, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setDeleteConfirmPost(post)
    }

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!deleteConfirmPost) return

        try {
            setIsDeleting(true)
            await communityService.deletePost(deleteConfirmPost.id)
            setPosts(prev => prev.filter(p => p.id !== deleteConfirmPost.id))
            if (selectedPost?.id === deleteConfirmPost.id) {
                closePostDetail()
            }
            setDeleteConfirmPost(null)
            showToast('Post deleted!')
        } catch (err) {
            console.error('Failed to delete post:', err)
            showToast('Failed to delete post. Please try again.', 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    // Check if user is author
    const isAuthor = (post: CommunityPost) => {
        return currentUserId && post.user_id === currentUserId
    }

    // Truncate content
    const truncateContent = (content: string, maxLength: number = 200) => {
        if (content.length <= maxLength) return content
        return content.substring(0, maxLength).trim() + '...'
    }

    return (
        <AppLayout>
            <div className="min-h-screen bg-background">
                {/* Toast notification */}
                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${toast.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                            }`}
                    >
                        {toast.message}
                    </div>
                )}

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                Farmer Community Forum
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Share knowledge, ask questions, and connect with fellow farmers
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Post
                        </Button>
                    </div>
                </div>

                {/* Filter/Tab Section */}
                <div className="mb-6 space-y-4">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={activeTab === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTab('all')}
                        >
                            All
                        </Button>
                        {(Object.keys(POST_TYPE_LABELS) as PostType[]).map(type => (
                            <Button
                                key={type}
                                variant={activeTab === type ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab(type)}
                            >
                                {POST_TYPE_LABELS[type]}
                            </Button>
                        ))}
                    </div>

                    {/* Search and Sort */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SortAsc className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(SORT_OPTIONS) as SortOption[]).map(option => (
                                    <SelectItem key={option} value={option}>
                                        {SORT_OPTIONS[option]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Create Post Form */}
                {showCreateForm && (
                    <Card className="mb-6 sm:max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-lg">Create New Post</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Title <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={createTitle}
                                    onChange={(e) => {
                                        setCreateTitle(e.target.value)
                                        if (formErrors.title) setFormErrors({ ...formErrors, title: '' })
                                    }}
                                    placeholder="Enter post title"
                                    maxLength={200}
                                    className={formErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {formErrors.title ? (
                                    <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {createTitle.length}/200 characters
                                    </p>
                                )}
                            </div>

                            {/* Content */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Content <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={createContent}
                                    onChange={(e) => {
                                        setCreateContent(e.target.value)
                                        if (formErrors.content) setFormErrors({ ...formErrors, content: '' })
                                    }}
                                    placeholder="Write your post content..."
                                    maxLength={2000}
                                    rows={5}
                                    className={`w-full min-h-[120px] px-3 py-2 text-sm border bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none ${formErrors.content ? "border-destructive focus:ring-destructive" : "border-input"
                                        }`}
                                />
                                {formErrors.content ? (
                                    <p className="text-xs text-destructive mt-1">{formErrors.content}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {createContent.length}/2000 characters (min 10)
                                    </p>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Category
                                </label>
                                <Select value={createCategory} onValueChange={(v) => setCreateCategory(v as PostType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(POST_TYPE_LABELS) as PostType[]).map(type => (
                                            <SelectItem key={type} value={type}>
                                                {POST_TYPE_LABELS[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Image (optional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.gif,.webp"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors">
                                            <ImageIcon className="h-4 w-4" />
                                            <span className="text-sm">Choose Image</span>
                                        </div>
                                    </label>
                                    {createImage && (
                                        <span className="text-sm text-muted-foreground">
                                            {createImage.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Max 5MB, JPG/PNG/GIF/WebP
                                </p>

                                {/* Image Preview */}
                                {createImagePreview && (
                                    <div className="mt-3 relative inline-block">
                                        <img
                                            src={createImagePreview}
                                            alt="Preview"
                                            className="max-w-xs max-h-48 rounded-lg object-cover"
                                        />
                                        <button
                                            onClick={clearImage}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelCreate}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={isCreating || createTitle.length < 3 || createContent.length < 10}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        'Post'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Posts List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-5">
                                <div className="flex justify-between mb-3">
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-20" />
                                </div>
                                <Skeleton className="h-7 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-4 w-2/3 mb-4" />
                                <div className="flex justify-between pt-3 border-t">
                                    <div className="flex gap-4">
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card className="p-8 text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={fetchPosts}>Try Again</Button>
                    </Card>
                ) : posts.length === 0 ? (
                    <Card className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">No posts yet</p>
                        <p className="text-muted-foreground mb-4">
                            Be the first to start a conversation!
                        </p>
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Post
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <Card
                                key={post.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => openPostDetail(post)}
                            >
                                <CardContent className="p-5">
                                    {/* Post Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            <span>{post.author_name || 'Anonymous'}</span>
                                            {post.district && (
                                                <>
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{post.district}</span>
                                                </>
                                            )}
                                            <Clock className="h-3 w-3 ml-2" />
                                            <span>{formatRelativeTime(post.created_at)}</span>
                                        </div>
                                        <Badge className={POST_TYPE_COLORS[post.post_type]}>
                                            {POST_TYPE_LABELS[post.post_type]}
                                        </Badge>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {post.title}
                                    </h3>

                                    {/* Content Preview */}
                                    <p className="text-muted-foreground mb-4">
                                        {truncateContent(post.content)}
                                        {post.content.length > 200 && (
                                            <span className="text-primary ml-1">Read more...</span>
                                        )}
                                    </p>

                                    {/* Image thumbnail */}
                                    {post.image_url && (
                                        <img
                                            src={post.image_url}
                                            alt=""
                                            className="w-full max-h-48 object-cover rounded-lg mb-4"
                                        />
                                    )}

                                    {/* Stats and Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t border-border">
                                        <div className="flex items-center gap-4">
                                            {/* Upvote */}
                                            <button
                                                onClick={(e) => handleUpvote(post, e)}
                                                className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_has_liked
                                                    ? 'text-red-500'
                                                    : 'text-muted-foreground hover:text-red-500'
                                                    }`}
                                            >
                                                <Heart
                                                    className={`h-5 w-5 ${post.user_has_liked ? 'fill-current' : ''}`}
                                                />
                                                <span>{post.likes_count}</span>
                                            </button>

                                            {/* Replies */}
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <MessageSquare className="h-5 w-5" />
                                                <span>{post.replies_count}</span>
                                            </div>
                                        </div>

                                        {/* Author Actions */}
                                        {isAuthor(post) && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => openEditDialog(post, e)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => openDeleteConfirm(post, e)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Detail Dialog */}
            <Dialog open={showPostDetail} onOpenChange={(open) => !open && closePostDetail()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedPost && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <Badge className={POST_TYPE_COLORS[selectedPost.post_type]}>
                                        {POST_TYPE_LABELS[selectedPost.post_type]}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-xl mt-2">
                                    {selectedPost.title}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4" />
                                    {selectedPost.author_name || 'Anonymous'}
                                    {selectedPost.district && (
                                        <>
                                            <span className="mx-1">•</span>
                                            <MapPin className="h-3 w-3" />
                                            {selectedPost.district}
                                        </>
                                    )}
                                    <span className="mx-1">•</span>
                                    {formatRelativeTime(selectedPost.created_at)}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Full Content */}
                            <div className="py-4">
                                <p className="text-foreground whitespace-pre-wrap">
                                    {selectedPost.content}
                                </p>

                                {/* Full Image */}
                                {selectedPost.image_url && (
                                    <img
                                        src={selectedPost.image_url}
                                        alt=""
                                        className="w-full rounded-lg mt-4"
                                    />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between py-3 border-t border-b border-border">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleUpvote(selectedPost)}
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${selectedPost.user_has_liked
                                            ? 'text-red-500'
                                            : 'text-muted-foreground hover:text-red-500'
                                            }`}
                                    >
                                        <Heart
                                            className={`h-5 w-5 ${selectedPost.user_has_liked ? 'fill-current' : ''}`}
                                        />
                                        <span>{selectedPost.likes_count} upvotes</span>
                                    </button>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MessageSquare className="h-5 w-5" />
                                        <span>{selectedPost.replies_count} replies</span>
                                    </div>
                                </div>

                                {isAuthor(selectedPost) && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(selectedPost)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => openDeleteConfirm(selectedPost)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Replies Section */}
                            <div className="py-4">
                                <h4 className="font-semibold text-foreground mb-4">
                                    Replies ({selectedPost.replies_count})
                                </h4>

                                {loadingReplies ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : replies.length > 0 ? (
                                    <div className="space-y-3 mb-4">
                                        {replies.map(reply => (
                                            <div
                                                key={reply.id}
                                                className="p-3 bg-muted rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <User className="h-3 w-3" />
                                                    <span>{reply.author_name || 'Anonymous'}</span>
                                                    <span>•</span>
                                                    <span>{formatRelativeTime(reply.created_at)}</span>
                                                </div>
                                                <p className="text-foreground text-sm">
                                                    {reply.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm mb-4">
                                        No replies yet. Be the first to reply!
                                    </p>
                                )}

                                {/* Reply Input */}
                                <div className="flex gap-2">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        rows={2}
                                        className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                                    />
                                    <Button
                                        onClick={handleAddReply}
                                        disabled={isReplying || !replyContent.trim()}
                                    >
                                        {isReplying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Post Dialog */}
            <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                                Title
                            </label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                                Content
                            </label>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                maxLength={2000}
                                rows={5}
                                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingPost(null)}
                            disabled={isEditing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isEditing}>
                            {isEditing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmPost} onOpenChange={(open) => !open && setDeleteConfirmPost(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmPost(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}
