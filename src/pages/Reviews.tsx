import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Star, User } from 'lucide-react';

interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName?: string; // Enhanced in frontend or backend
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/admin/reviews/my');
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h1>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Customer #{review.userId.split('_')[2]}</h3>
                  <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-yellow-700">{review.rating}</span>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-4">
              {review.comment}
            </p>

            <div className="text-xs text-gray-400">
              Order ID: #{review.orderId}
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No reviews received yet.
          </div>
        )}
      </div>
    </div>
  );
}