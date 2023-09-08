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
            thumbnail: {
                public_id: 'DUMMY',
                secure_url: 'DUMMY'
            }
        });

        console.log(req.file)

        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
            });
            console.log(result.secure_url)

            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
            fs.rm(`uploads/${req.file.filename}`)
        }
        await course.save();
        res.status(200).json({
            success: true,
            massage: 'Course created successfully',
            course
        })
    } catch (error) {
        console.log(error.message)
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

const addLectureToCourseById = async (req, res, next) => {
    const { title, description } = req.body;
    const { courseId } = req.params;

    let lectureData = {};

    if (!title || !description) {
        return next(new AppError('Title and Description are required', 400));
    }

    const course = await Course.findById(courseId);

    if (!course) {
        return next(new AppError('Invalid course id or course not found.', 400));
    }

    // Run only if user sends a file
    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms', // Save files in a folder named lms
            });

            // If success
            if (result) {
                // Set the public_id and secure_url in array
                lectureData.public_id = result.public_id;
                lectureData.secure_url = result.secure_url;
            }

            // After successful upload remove the file from local storage
            fs.rm(`uploads/${req.file.filename}`);
        } catch (error) {
            // Empty the uploads directory without deleting the uploads directory
            for (const file of await fs.readdir('uploads/')) {
                await fs.unlink(path.join('uploads/', file));
            }

            // Send the error message
            return next(
                new AppError(
                    JSON.stringify(error) || 'File not uploaded, please try again',
                    400
                )
            );
        }
    }

    course.lectures.push({
        title,
        description,
        lecture: lectureData,
    });

    course.numberOfLectures = course.lectures.length;

    // Save the course object
    await course.save();

    res.status(200).json({
        success: true,
        message: 'Course lecture added successfully',
        course,
    });
};

export { getAllCourses, getLecturesByCourseId, createCourse, updateCourse, deleteCourse, addLectureToCourseById }