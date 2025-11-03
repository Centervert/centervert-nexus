import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThumbsUp, ThumbsDown, Heart, Sparkles, Brain, SmilePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MessageReactionsProps {
  messageId: string;
  messageType: 'ticket' | 'opportunity';
}

const REACTION_ICONS = {
  thumbs_up: { icon: ThumbsUp, label: 'Thumbs Up', color: 'text-blue-500' },
  thumbs_down: { icon: ThumbsDown, label: 'Thumbs Down', color: 'text-red-500' },
  heart: { icon: Heart, label: 'Heart', color: 'text-pink-500' },
  celebrate: { icon: Sparkles, label: 'Celebrate', color: 'text-yellow-500' },
  thinking: { icon: Brain, label: 'Thinking', color: 'text-purple-500' },
};

export const MessageReactions = ({ messageId, messageType }: MessageReactionsProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const tableName = messageType === 'ticket' ? 'ticket_message_reactions' : 'opportunity_message_reactions';

  const { data: reactions = [] } = useQuery({
    queryKey: ['message-reactions', messageId, messageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*, user:profiles(full_name)')
        .eq('message_id', messageId);

      if (error) throw error;
      return data;
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const addReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!currentUser) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(tableName)
        .insert({
          message_id: messageId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId, messageType] });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('You already reacted with this');
      } else {
        toast.error('Failed to add reaction');
      }
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!currentUser) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId, messageType] });
    },
    onError: () => {
      toast.error('Failed to remove reaction');
    },
  });

  const handleReactionClick = (reactionType: string) => {
    const userReaction = reactions.find(
      (r) => r.user_id === currentUser?.id && r.reaction_type === reactionType
    );

    if (userReaction) {
      removeReaction.mutate(reactionType);
    } else {
      addReaction.mutate(reactionType);
    }
  };

  // Group reactions by type
  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction_type]) {
      acc[reaction.reaction_type] = [];
    }
    acc[reaction.reaction_type].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Display existing reactions */}
      {Object.entries(reactionGroups).map(([type, reactionList]) => {
        const { icon: Icon, color } = REACTION_ICONS[type as keyof typeof REACTION_ICONS];
        const hasUserReacted = reactionList.some((r) => r.user_id === currentUser?.id);

        return (
          <Button
            key={type}
            variant={hasUserReacted ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => handleReactionClick(type)}
          >
            <Icon className={`h-3 w-3 ${hasUserReacted ? '' : color}`} />
            <span>{reactionList.length}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <SmilePlus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {Object.entries(REACTION_ICONS).map(([type, { icon: Icon, label, color }]) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleReactionClick(type)}
                title={label}
              >
                <Icon className={`h-4 w-4 ${color}`} />
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
