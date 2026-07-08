import { X, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cart.store';
import { useUserStore } from '../store/auth.store';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function CartDrawer() {
  const { items, isOpen, removeItem, clearCart, getTotal, setCartOpen } = useCartStore();
  const { localUser } = useUserStore();
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const total = getTotal();

  const handleCheckout = async () => {
    if (!localUser) {
      toast.error('Please log in to purchase');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!(window as any).Razorpay) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setProcessing(true);
    try {
      const { data } = await api.post('/checkout/create-order', {
        items: items.map((item) => ({ productId: item._id })),
      });

      const { razorpayOrderId, razorpayKeyId, amount } = data.data;

      const options = {
        key: razorpayKeyId,
        amount,
        currency: 'INR',
        name: 'Gumroad',
        description: items.length === 1 ? items[0].name : `${items.length} items`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            await api.post('/checkout/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            setCartOpen(false);
            toast.success('Purchase successful! 🎉');
            window.location.href = '/checkout/success';
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: {},
        theme: { color: '#ff90e8' },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to initiate payment';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="cart-overlay" onClick={() => setCartOpen(false)} />

      {/* Drawer */}
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h3 className="cart-drawer__title">
            <ShoppingCart size={18} />
            Cart ({items.length})
          </h3>
          <button onClick={() => setCartOpen(false)} className="cart-drawer__close">
            <X size={20} />
          </button>
        </div>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <ShoppingCart size={40} strokeWidth={1.5} />
              <p>Your cart is empty</p>
              <Link
                to="/discover"
                className="cart-drawer__browse"
                onClick={() => setCartOpen(false)}
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div key={item.slug} className="cart-item">
                  <Link
                    to={`/products/${item.slug}`}
                    className="cart-item__image-wrap"
                    onClick={() => setCartOpen(false)}
                  >
                    <img
                      src={item.coverImage || '/asset/assets/images/cover_placeholder.png'}
                      alt={item.name}
                      className="cart-item__image"
                    />
                  </Link>
                  <div className="cart-item__info">
                    <Link
                      to={`/products/${item.slug}`}
                      className="cart-item__name"
                      onClick={() => setCartOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <span className="cart-item__creator">
                      by {item.creator?.name}
                    </span>
                    <span className="cart-item__price">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(item.slug)}
                    className="cart-item__remove"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Total</span>
              <span className="cart-drawer__total-amount">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="cart-drawer__checkout"
            >
              {processing ? 'Processing...' : 'Checkout'}
            </button>
            <button onClick={clearCart} className="cart-drawer__clear">
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
