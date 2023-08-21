import User from '../models/user.model.js';
import AppError from "../utils/appError.js";

const cookieOptions = {
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true
}

const register = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

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

        if (!User) {
            return next(new AppError("User registration failed please try again", 400))
        }

        // TODO: upload user picture

        await user.save();

        // TODO: get JWT token in cookie

        res.status(200).json({
            success: true,
            massage: "User registered successfully",
            user
        })
    } catch (error) {
        console.log(error)
    }
}

const login = async (req, res) => {
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

    res.cookie("token", token, cookieOptions);

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

export {
    register,
    login,
    logout,
    gegtProfile
}