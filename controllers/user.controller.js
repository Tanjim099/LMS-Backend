import User from '../models/user.model.js';
import AppError from "../utils/appError.js";
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const cookieOptions = {
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true
}

const register = async (req, res, next) => {
    const { fullName, email, password } = req.body;
    try {

        if (!fullName || !email || !password) {
            return next(new AppError("All fields are required", 400))
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return next(new AppError("Email already exists", 400))
        }

        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
            }
        });

        if (!user) {
            return next(new AppError("User registration failed please try again", 400))
        }

        // TODO: upload user picture

        console.log('file details >', JSON.stringify(req.file))

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader(req.file.path, {
                    folder: 'LMS',
                    width: 250,
                    heigth: 250,
                    gravity: 'faces',
                    crop: 'fill'
                });

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    // remove file from local server
                    fs.rm(`uploads/${req.file.filename}`);
                }
            } catch (e) {

                res.status(501).send({ msg: error.message + "file not uploded please try again" })
            }
        }

        await user.save();

        // TODO: get JWT token in cookie

        const token = await user.generateJWTToken();
        res.cookie("token", token, cookieOptions);
        user.password = undefined;

        res.status(200).json({
            success: true,
            massage: "User registered successfully",
            user
        })
    } catch (error) {
        res.status(501).json({ success: false, err: error.message })
    }
}

const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("All fields are required", 400))
    }

    const user = await User.findOne({
        email
    }).select('+password');

    if (!user || !user.comparePassword(password)) { // TODO
        return next(new AppError("Email or Password do not match", 400))
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
        success: true,
        massage: "User login successfully",
        user
    })
}

const logout = (req, res) => {
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        massage: "User logged out successfully"
    })

}

const gegtProfile = (req, res) => {
    const user = User.findById(req.user.id);

    res.status(200).json({
        success: true,
        massage: "User details",
        user
    })
}

const forgotPassord = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(
            new AppError("Email is required", 400)
        )
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(
            new AppError("Email is not registered", 400)
        )
    }

    const resetToken = await user.generatePasswordToken()

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = "Reset Password";
    const massage = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    console.log(resetPasswordUrl)
    try {
        await sendEmail(email, subject, massage);
        res.status(200).json({
            success: true,
            massage: `Reset password token has been sent to ${email} successfully!`
        });
    } catch (e) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save();
        return next(new AppError(e.massage, 500))
    }

}

const resetPassword = async (req, res, next) => {

}

export {
    register,
    login,
    logout,
    gegtProfile,
    forgotPassord,
    resetPassword
}