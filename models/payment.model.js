import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_subscription_id: {
        type: String,
        required: true
    },
    razorpay_signture_id: {
        type: String,
        required: String
    }
});

const Payment = new model('Payment', paymentSchema);

export default Payment