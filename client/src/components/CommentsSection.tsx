import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface CommentsSectionProps {
  newsId: number;
}

export default function CommentsSection({ newsId }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [userRating, setUserRating] = useState<number>(0);
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: comments, isLoading: commentsLoading } = trpc.comments.list.useQuery({ newsId });
  const { data: ratingData } = trpc.ratings.get.useQuery({ newsId });
  const { data: userRatingData } = trpc.ratings.getUserRating.useQuery(
    { newsId },
    { enabled: isAuthenticated }
  );

  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعليق بنجاح");
      setCommentText("");
      utils.comments.list.invalidate({ newsId });
    },
    onError: () => {
      toast.error("فشل إضافة التعليق");
    },
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التعليق");
      utils.comments.list.invalidate({ newsId });
    },
  });

  const addRatingMutation = trpc.ratings.add.useMutation({
    onSuccess: () => {
      toast.success("تم تقييم الخبر بنجاح");
      utils.ratings.get.invalidate({ newsId });
      utils.ratings.getUserRating.invalidate({ newsId });
    },
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!commentText.trim()) {
      toast.error("الرجاء كتابة تعليق");
      return;
    }

    addCommentMutation.mutate({ newsId, content: commentText });
  };

  const handleRating = (rating: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setUserRating(rating);
    addRatingMutation.mutate({ newsId, rating });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate({ commentId });
  };

  const currentUserRating = userRatingData?.rating || userRating;

  return (
    <div className="space-y-6">
      {/* Rating Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-text">
            <Star className="h-5 w-5 text-yellow-500" />
            تقييم الخبر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-110"
                  disabled={!isAuthenticated}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= currentUserRating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {ratingData && ratingData.count > 0 && (
              <div className="text-sm text-muted-foreground arabic-text">
                <span className="font-bold text-lg">{ratingData.average.toFixed(1)}</span>
                <span className="mx-1">/</span>
                <span>5</span>
                <span className="mr-2">({ratingData.count} تقييم)</span>
              </div>
            )}
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-2 arabic-text">
              يجب تسجيل الدخول لتقييم الخبر
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-text">
            <MessageSquare className="h-5 w-5" />
            التعليقات ({comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          <div className="space-y-2">
            <Textarea
              placeholder={
                isAuthenticated
                  ? "اكتب تعليقك هنا..."
                  : "يجب تسجيل الدخول للتعليق"
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!isAuthenticated}
              className="arabic-text min-h-[100px]"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!isAuthenticated || !commentText.trim() || addCommentMutation.isPending}
              className="arabic-text"
            >
              <Send className="h-4 w-4 ml-2" />
              إرسال التعليق
            </Button>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {comment.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium arabic-text">{comment.user.name || "مستخدم"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString("ar-SA")}
                        </p>
                      </div>
                      {user && user.id === comment.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm arabic-text text-right leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground arabic-text py-8">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
