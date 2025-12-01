import { MdClose, MdDelete } from 'react-icons/md';

const ReactionInfo = ({ reactions, onClose, currentUserId, onRemoveReaction, messageId }) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const handleRemove = (emoji) => {
    onRemoveReaction(messageId, emoji);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="reaction-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reaction-info-header">
          <h3>Reactions</h3>
          <button className="close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="reaction-info-content">
          {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
            const userReacted = reactionList.some(r => r.user_id === currentUserId);
            
            return (
              <div key={emoji} className="reaction-group">
                <div className="reaction-group-header">
                  <span className="reaction-emoji-large">{emoji}</span>
                  <span className="reaction-count">{reactionList.length}</span>
                  {userReacted && (
                    <button 
                      className="remove-reaction-btn"
                      onClick={() => handleRemove(emoji)}
                      title="Remove your reaction"
                    >
                      <MdDelete /> Remove
                    </button>
                  )}
                </div>
                <div className="reaction-users-list">
                  {reactionList.map((reaction, idx) => (
                    <div key={idx} className="reaction-user-item">
                      <div className="reaction-user-avatar">
                        {(reaction.username || `User ${reaction.user_id}`).charAt(0).toUpperCase()}
                      </div>
                      <div className="reaction-user-info">
                        <span className="reaction-user-name">
                          {reaction.username || `User ${reaction.user_id}`}
                          {reaction.user_id === currentUserId && ' (You)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReactionInfo;
