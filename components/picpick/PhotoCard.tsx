import React, { useState } from 'react';
import { Icons } from './Icons';

interface PhotoCardProps {
    photo: any;
    onVote: (photoId: string) => void;
    votingOpen: boolean;
    canVote: boolean;
    hasVoted: boolean;
    showVoteCounts: boolean;
}

export const PhotoCard = ({ photo, onVote, votingOpen, canVote, hasVoted, showVoteCounts }: PhotoCardProps) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            {/* Circular Photo Card */}
            <div className="flex flex-col items-center gap-3 group">
                {/* Circular Photo */}
                <div
                    onClick={() => setShowModal(true)}
                    className="relative cursor-pointer"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-purple-500/30">
                        <img
                            src={photo.imageUrl}
                            alt="Contest photo"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Vote Count Badge (if enabled) */}
                    {showVoteCounts && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white/20 shadow-lg">
                            <span className="text-white font-bold text-sm">{photo.votes}</span>
                        </div>
                    )}

                    {/* Voted Indicator */}
                    {hasVoted && (
                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                            <Icons.Check style={{ width: '16px', height: '16px', color: 'white' }} />
                        </div>
                    )}
                </div>

                {/* Uploader Name */}
                {photo.userName && (
                    <div className="text-center">
                        <p className="text-sm text-white/80 font-medium">{photo.userName}</p>
                    </div>
                )}

                {/* Vote Button */}
                {votingOpen && (
                    <button
                        onClick={() => onVote(photo.id)}
                        disabled={!canVote || hasVoted}
                        className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${hasVoted
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                : canVote
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105 active:scale-95'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                    >
                        {hasVoted ? (
                            <>
                                <Icons.Check style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                                Voted
                            </>
                        ) : canVote ? (
                            <>
                                <Icons.Heart filled={false} style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                                Vote
                            </>
                        ) : (
                            'No Votes Left'
                        )}
                    </button>
                )}
            </div>

            {/* Full Image Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white text-4xl font-light"
                        >
                            ×
                        </button>

                        {/* Full Image */}
                        <img
                            src={photo.imageUrl}
                            alt="Full size"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Image Info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                            {photo.userName && (
                                <p className="text-white font-medium">{photo.userName}</p>
                            )}
                            {showVoteCounts && (
                                <p className="text-white/60 text-sm">{photo.votes} votes</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
