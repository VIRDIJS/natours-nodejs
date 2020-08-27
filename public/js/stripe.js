import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51HKEneGyAbOwMTQYmQZ9dToVkQeHaE9fRcxLwYX1dqP9j6OPfToO3mqKYG7wIkWEdYlUdxRWz7sN6e3KIbfdbfuj00iBZ61GEj'
    );

    // 1. Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });
    // console.log(session);
    // 2. Create checkout form & charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
