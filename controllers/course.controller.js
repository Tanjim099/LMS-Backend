import Course from "../models/course.model.js"
import AppError from "../utils/appError.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const getAllCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({}).select('-lectures');
        res.status(200).json({
            success: true,
            massage: 'All courses',
            courses
        })
    } catch (error) {
        return next(
            new AppError(error.massage, 500)
        )
    }
}

const getLecturesByCourseId = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) {
            return next(
                new AppError('Invalid course Id', 400)
            )
        }
        res.status(200).json({
            success: true,
            massage: 'Course lectures feched successfully',
            lectures: course.lectures

        })
    } catch (error) {
        return next(
            new AppError(error.massage, 500)
        )
    }
}


const createCourse = async (req, res, next) => {
    try {
        const { title, description, category, createdBy } = req.body;
        if (!title || !description || !category || !createdBy) {
            return next(
                new AppError('All fiels are required', 400)
            )
        }
        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbail: {
                public_id: 'DUMMY',
                secure_url: 'DUMMY'
            }
        });

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.body.file.path, {
                folder: 'lms',
            });
            if (result) {
                course.thumbail.public_id = result.public_id;
                course.thumbail.secure_url = result.secure_url;
            }
            fs.rm(`uploads/${req.file.fileName}`)
        }

        await course.save();
        res.status(200).json({
            success: true,
            massage: 'Course created successfully',
            course
        })
    } catch (error) {
        return next(
            new AppError("error", 500)
        )
    }
}
const updateCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )
        if (!course) {
            return next(
                new AppError('Course is does not exists', 400)
            )
        }

        res.status(200).json({
            success: true,
            massage: 'Course updated successfully'
        })
    } catch (error) {
        return next(
            new AppError(error.massage, 500)
        )
    }
}
const deleteCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        console.log(courseId)
        // Finding the course via the course ID
        const course = await Course.findByIdAndDelete(courseId);

        // If course not find send the message as stated below
        if (!course) {
            return next(new AppError('Course with given id does not exist.', 404));
        }

        // Remove course
        // await course.remove();

        // Send the message as response
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error) {
        return next(
            new AppError(error.massage, 500)
        )
    }
}

export { getAllCourses, getLecturesByCourseId, createCourse, updateCourse, deleteCourse }