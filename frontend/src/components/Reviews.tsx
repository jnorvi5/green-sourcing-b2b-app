/**
 * Reviews and Ratings System
 *
 * Product and supplier reviews from verified buyers
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FunnelIcon,
  CheckBadgeIcon,
  PhotoIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Review {
  id: string;
  author: {
    name: string;
    company: string;
    avatar?: string;
    verified: boolean;
  };
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  notHelpful: number;
  images?: string[];
  orderId?: string;
  response?: {
    author: string;
    content: string;
    date: string;
  };
  aspects?: {
    quality: number;
    delivery: number;
    communication: number;
    value: number;
  };
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  aspects: {
    quality: number;
    delivery: number;
    communication: number;
    value: number;
  };
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    author: {
      name: 'Sarah Johnson',
      company: 'GreenBuild Architecture',
      verified: true,
    },
    rating: 5,
    title: 'Excellent quality recycled steel',
    content:
      'The recycled structural steel exceeded our expectations. The quality is indistinguishable from virgin steel, and the carbon savings are significant. Delivery was on time and the team was very responsive to our questions.',
    date: '2024-01-15',
    helpful: 24,
    notHelpful: 1,
    orderId: 'ORD-2024-0745',
    aspects: {
      quality: 5,
      delivery: 5,
      communication: 5,
      value: 4,
    },
    response: {
      author: 'EcoSteel Solutions',
      content: 'Thank you Sarah! We\'re thrilled to hear the steel met your project needs. Looking forward to working with you again!',
      date: '2024-01-16',
    },
  },
  {
    id: 'r2',
    author: {
      name: 'Michael Chen',
      company: 'Sustainable Developers Inc',
      verified: true,
    },
    rating: 4,
    title: 'Great product, slight delay in shipping',
    content:
      'The product quality is excellent and the EPD documentation was thorough. Only giving 4 stars because shipping took a few days longer than quoted, but the supplier communicated proactively about the delay.',
    date: '2024-01-10',
    helpful: 18,
    notHelpful: 2,
    orderId: 'ORD-2024-0712',
    aspects: {
      quality: 5,
      delivery: 3,
      communication: 4,
      value: 4,
    },
  },
  {
    id: 'r3',
    author: {
      name: 'Emily Davis',
      company: 'Modern Architects Group',
      verified: true,
    },
    rating: 5,
    title: 'Perfect for LEED certification',
    content:
      'Used this steel for our LEED Platinum project. The EPD data was exactly what we needed for our documentation, and the recycled content helped us earn additional points. Highly recommend for any green building project.',
    date: '2024-01-05',
    helpful: 32,
    notHelpful: 0,
    orderId: 'ORD-2024-0698',
    aspects: {
      quality: 5,
      delivery: 5,
      communication: 5,
      value: 5,
    },
    images: ['https://example.com/project1.jpg', 'https://example.com/project2.jpg'],
  },
  {
    id: 'r4',
    author: {
      name: 'Robert Williams',
      company: 'BuildRight Construction',
      verified: true,
    },
    rating: 3,
    title: 'Good quality but pricey',
    content:
      'The steel quality is good and certifications are legit. However, the premium over conventional steel is quite high. Would use again for projects where sustainability is a key requirement.',
    date: '2023-12-28',
    helpful: 11,
    notHelpful: 3,
    aspects: {
      quality: 4,
      delivery: 4,
      communication: 4,
      value: 2,
    },
  },
  {
    id: 'r5',
    author: {
      name: 'Lisa Park',
      company: 'EcoConstruct Ltd',
      verified: false,
    },
    rating: 5,
    title: 'Outstanding service',
    content:
      'From inquiry to delivery, the experience was seamless. The team was knowledgeable about carbon calculations and helped us optimize our material selection.',
    date: '2023-12-20',
    helpful: 8,
    notHelpful: 0,
    aspects: {
      quality: 5,
      delivery: 5,
      communication: 5,
      value: 4,
    },
  },
];

const MOCK_SUMMARY: ReviewSummary = {
  averageRating: 4.4,
  totalReviews: 127,
  distribution: {
    5: 72,
    4: 35,
    3: 12,
    2: 5,
    1: 3,
  },
  aspects: {
    quality: 4.6,
    delivery: 4.2,
    communication: 4.5,
    value: 4.1,
  },
};

interface ReviewsListProps {
  productId?: string;
  supplierId?: string;
  showSummary?: boolean;
  limit?: number;
}

export function ReviewsList({ productId, supplierId, showSummary = true, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'helpful' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setReviews(limit ? MOCK_REVIEWS.slice(0, limit) : MOCK_REVIEWS);
      setSummary(MOCK_SUMMARY);
      setLoading(false);
    };
    fetchReviews();
  }, [productId, supplierId, limit]);

  const handleHelpful = (reviewId: string, isHelpful: boolean) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpful: isHelpful ? r.helpful + 1 : r.helpful,
              notHelpful: !isHelpful ? r.notHelpful + 1 : r.notHelpful,
            }
          : r
      )
    );
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpful - a.helpful;
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const filteredReviews = filterRating
    ? sortedReviews.filter((r) => r.rating === filterRating)
    : sortedReviews;

  const renderStars = (rating: number, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <StarIconSolid className={`${size} text-yellow-400`} />
            ) : (
              <StarIcon className={`${size} text-gray-600`} />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      {showSummary && summary && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-white">{summary.averageRating.toFixed(1)}</div>
                <div>
                  {renderStars(Math.round(summary.averageRating), 'w-6 h-6')}
                  <p className="text-sm text-gray-400 mt-1">Based on {summary.totalReviews} reviews</p>
                </div>
              </div>

              {/* Distribution */}
              <div className="mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution[star as keyof typeof summary.distribution];
                  const percentage = (count / summary.totalReviews) * 100;
                  return (
                    <button
                      key={star}
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`w-full flex items-center gap-2 group ${
                        filterRating === star ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="text-sm text-gray-400 w-4">{star}</span>
                      <StarIconSolid className="w-4 h-4 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            filterRating === star ? 'bg-emerald-500' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratings */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">Ratings by Aspect</h4>
              <div className="space-y-3">
                {Object.entries(summary.aspects).map(([aspect, rating]) => (
                  <div key={aspect} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{aspect}</span>
                    <div className="flex items-center gap-2">
                      {renderStars(Math.round(rating), 'w-4 h-4')}
                      <span className="text-sm text-gray-400 w-8">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="text-sm text-emerald-400 hover:underline"
          >
            Clear filter (showing {filterRating}-star only)
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No reviews yet</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.author.avatar ? (
                    <img
                      src={review.author.avatar}
                      alt={review.author.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-medium">
                      {review.author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author.name}</span>
                      {review.author.verified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckBadgeIcon className="w-4 h-4" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{review.author.company}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {/* Rating & Title */}
              <div className="flex items-center gap-3 mb-2">
                {renderStars(review.rating, 'w-5 h-5')}
                <h4 className="font-medium">{review.title}</h4>
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-4">{review.content}</p>

              {/* Aspect Ratings */}
              {review.aspects && (
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  {Object.entries(review.aspects).map(([aspect, rating]) => (
                    <div key={aspect} className="flex items-center gap-1">
                      <span className="text-gray-500 capitalize">{aspect}:</span>
                      <span className="text-yellow-400">{rating}/5</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  ))}
                </div>
              )}

              {/* Supplier Response */}
              {review.response && (
                <div className="bg-gray-900/50 border-l-2 border-emerald-500 rounded-r-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-sm">{review.response.author}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.response.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{review.response.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Was this helpful?</span>
                  <button
                    onClick={() => handleHelpful(review.id, true)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    <HandThumbUpIcon className="w-5 h-5" />
                    <span>{review.helpful}</span>
                  </button>
                  <button
                    onClick={() => handleHelpful(review.id, false)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <HandThumbDownIcon className="w-5 h-5" />
                    <span>{review.notHelpful}</span>
                  </button>
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-400 transition-colors">
                  <FlagIcon className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Write Review Modal Component
interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onSubmit: (review: Omit<Review, 'id' | 'author' | 'date' | 'helpful' | 'notHelpful'>) => void;
}

export function WriteReviewModal({ isOpen, onClose, productName, onSubmit }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aspects, setAspects] = useState({
    quality: 0,
    delivery: 0,
    communication: 0,
    value: 0,
  });

  const handleSubmit = () => {
    if (rating === 0 || !title.trim() || !content.trim()) return;
    onSubmit({
      rating,
      title,
      content,
      aspects: Object.values(aspects).every((v) => v > 0) ? aspects : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Write a Review</h2>
          <p className="text-gray-400 text-sm mt-1">{productName}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Overall Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  {star <= (hoverRating || rating) ? (
                    <StarIconSolid className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <StarIcon className="w-8 h-8 text-gray-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratings */}
          <div>
            <label className="block text-sm font-medium mb-3">Rate by Aspect (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(aspects).map((aspect) => (
                <div key={aspect} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">{aspect}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setAspects((prev) => ({ ...prev, [aspect]: star }))
                        }
                      >
                        {star <= aspects[aspect as keyof typeof aspects] ? (
                          <StarIconSolid className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <StarIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Review Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Review *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || !title.trim() || !content.trim()}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewsList;
