import { Schema, model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Name is required"],
        minLength: [5, "Name must be at-least 5 character"],
        maxLength: [50, "Name must should be less than 50 characters"],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill in a valid email address',
        ]
    },
    password: {
        type: String,
        required: [true, 'Pass is required'],
        minLength: [8, 'Password must be atleast 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: 'USER'
    },
    avatar: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date

}, {
    timestamps: true
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcryptjs.hash(this.password, 10);
});

userSchema.method = {
    comparePassword: async function (plainTextPassword) {
        return bcryptjs.compare(plainTextPassword, this.password)
    },
    generateJWTToken: function () {
        return jwt.sign({
            id: this._id, role: this.role, email: this.email, subscription: this.subscription
        }),
            process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY
        }
    }
}

const User = model("User", userSchema);

export default User;