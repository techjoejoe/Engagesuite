import React from 'react';
import { Icons } from './Icons';

interface PhotoCardProps {
    photo: any;
    rank: number;
    galleryId: string;
    onVote: (photoId: string) => void;
    votingOpen: boolean;
    canVote: boolean;
    votesRemaining: number;
    votesOnThis: number;
}

export const PhotoCard = ({ photo, rank, galleryId, onVote, votingOpen, canVote, votesRemaining, votesOnThis }: PhotoCardProps) => {
    const maxReached = votesOnThis >= 2;
    const noVotesLeft = votesRemaining <= 0;

    const getButtonText = () => {
        if (!votingOpen) return 'Voting Closed';
        if (maxReached) return 'Max Votes (2)';
        if (noVotesLeft) return 'No Votes Left';
        return `Vote (${2 - votesOnThis} left)`;
    };

    return (
        <div className="glass rounded-2xl overflow-hidden transition-all duration-400 hover:-translate-y-2 hover:scale-[1.02] border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="aspect-square relative">
                <img src={photo.imageUrl} alt="Contest photo" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
                    <span className="font-mono text-sm text-white">#{rank}</span>
                </div>
                <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Icons.Heart filled={true} />
                    <span className="font-mono text-sm text-white">{photo.votes}</span>
                </div>
            </div>

            <div className="p-4">
                <button
                    onClick={() => onVote(photo.id)}
                    disabled={!canVote}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${canVote
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                >
                    <Icons.Heart filled={votesOnThis > 0} />
                    {getButtonText()}
                </button>
            </div>
        </div>
    );
};
