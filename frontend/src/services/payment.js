// Payment service integrating real Razorpay or falling back to a premium simulated modal checkout.

export const paymentService = {
  // Load Razorpay Script dynamically
  loadRazorpayScript: () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  // Checkout trigger
  processPayment: async ({ amount, orderId, customerInfo, onPaymentSuccess, onPaymentError, simulate = true }) => {
    // If a real key is present in environment, we use actual Razorpay
    const realKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    if (realKey && !simulate) {
      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        onPaymentError(new Error("Failed to load Razorpay SDK. Please check your internet connection."));
        return;
      }

      const options = {
        key: realKey,
        amount: Math.round(amount * 100), // in paise
        currency: "INR",
        name: "Me Nestham By Bhanni",
        description: `Payment for Order #${orderId}`,
        image: "https://images.unsplash.com/photo-1605886300898-1e42f9e4bd33?auto=format&fit=crop&w=150&q=80",
        handler: function (response) {
          onPaymentSuccess({
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            orderId: response.razorpay_order_id || orderId
          });
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: "#E8873A" // Brand saffron color
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        onPaymentError(error);
      }
    } else {
      // Execute the premium simulator checkout (which the app's components will render).
      // Here we just return a promise that resolves when the mockup confirms it.
      // In the Checkout page, we will show a mock overlay modal if no real Razorpay key is present.
      // So this method returns a handler that tells the component to open the mock modal.
      return {
        isSimulation: true,
        orderId,
        amount
      };
    }
  }
};
