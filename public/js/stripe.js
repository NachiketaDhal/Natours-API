/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51IAz1lG6PPOjwmB8qmOjJW9juoI8mXyQ4HLOaLB6aNCOGGpD0e3TDASUfVDUF4Gi7kfulFcRK4ZoVRIz8Y2uql8L00yLDiP9Wj'
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
