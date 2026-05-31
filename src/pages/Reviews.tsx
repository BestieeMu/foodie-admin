import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Star, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

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
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reviews/my');
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        size={16} 
        className={idx < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading reviews...</p>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">See what customers are saying about your food.</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-semibold text-gray-600">Average Rating:</span>
            <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1 rounded-lg">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">{averageRating}</span>
            </div>
            <span className="text-sm text-gray-400">({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[400px]">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100">
            <MessageSquare size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Reviews Yet</h2>
          <p className="text-gray-500 max-w-md text-base leading-relaxed">
            Customers will be able to leave reviews after their orders are completed. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent -z-10 rounded-bl-full opacity-50 group-hover:from-orange-50 transition-colors duration-500"></div>
              
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold shadow-inner border border-white">
                    <User size={20} className="opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Customer #{review.userId.substring(review.userId.length - 4).toUpperCase()}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <div className="bg-gray-50/50 p-4 rounded-xl mb-4 border border-gray-100/50">
                <p className="text-gray-700 leading-relaxed italic text-sm">
                  "{review.comment}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Order ID: #{review.orderId.substring(0, 8)}</span>
                <button className="text-primary hover:underline hover:text-orange-600 transition-colors">View Order</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}