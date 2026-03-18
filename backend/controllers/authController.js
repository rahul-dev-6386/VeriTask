import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { userModel, otpModel } from "../../db.js";
import { JWT_SECRET, REFRESH_SECRET, cookieOptions } from "../config/env.js";
import { transporter } from "../config/mailer.js";

async function signupHandler(req, res) {

    // for input validation we are using zord
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        name: z.string().min(3).max(100),
        password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            "Password must contain uppercase, lowercase, number and special character")
    })
    // for parsing data in zod to validate
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    // it will throw the error if user try to enter invalid format
    if (!parsedDataWithSuccess.success) {

        const formattedErrors = {};

        parsedDataWithSuccess.error.issues.forEach((err) => {
            formattedErrors[err.path[0]] = err.message;
        });

        return res.status(400).json({
            message: "Validation failed",
            errors: formattedErrors
        });
    }
    const { email, password, name} = req.body;

    try {
        const existingUser = await userModel.findOne({email});
        if(existingUser) {
            return res.status(400).json({
                message: "User Already Exists"
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // we are deleting all existing otp of user regarding that email
        await otpModel.deleteMany({email});

        // now we are storing otpModel in the database
        await otpModel.create({
            email,
            otp: await bcrypt.hash(otp,10),
            name,
            password: await bcrypt.hash(password,10),
        });

        // send Email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "OTP Verification",
                text: `Your One time Verification code is ${otp}`
            });
        } catch (err) {
            // rollback OTP if email fails
            await otpModel.deleteMany({ email });

            return res.status(500).json({
                message: "Failed to send OTP"
            });
        }
    return res.json({
            message: "OTP send to your registered Email"
        });

    } catch(err) {
        return res.status(500).json({
            message: "Error While sending OTP"
        });
    }
    
}

async function verifyOtpHandler(req,res) {

    const requiredBody = z.object({
    email: z.string().email(),
    otp: z.string().length(6)
});

    const parsed = requiredBody.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid input"
        });
    }

    const { email, otp } = parsed.data;

    try {

        const record = await otpModel.findOne({ email }).sort({ createdAt: -1 });
        if(!record)
        {
            return res.status(400).json({
                message: "No Record found"
            });
        }
        if(record.attempts >= 5) {
            return res.status(429).json({
                message: "Too many Attempts Try again later"
            });
        }

        const isExpired = (Date.now() - record.createdAt.getTime()) > 5*60*1000;
        if(isExpired) {
            return res.status(400).json({
                message: "OTP is expired"
            });
        }

        const isMatch = await bcrypt.compare(otp,record.otp);

        if(!isMatch) {

            // no each wrong otp we are updating the count of attempts
            await otpModel.updateOne({
                _id: record._id,
            },
        {
            $inc: {attempts: 1}
        });

            return res.status(400).json({
                message: "INVALID OTP"
            });
        }


        // here we need to check again that is user hitting the verify twice if twice handle it
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }




        await userModel.create({
            email: record.email,
            password: record.password,
            name: record.name,
            refreshTokens: []
        });

        await otpModel.deleteMany({email});
        
        return res.json({
            message: "You are Signed Up"
        });
    } catch(err) {
        return res.status(500).json({
            message: "Verification Failed"
        });
    }
}

async function signinHandler(req, res) {
    // Input validation using zod
    const requiredBody = z.object({
        email: z.string().min(4).max(100).email(),
        password: z.string()
    });

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataWithSuccess.success) {
        const formattedErrors = {};

        parsedDataWithSuccess.error.issues.forEach((err) => {
            formattedErrors[err.path[0]] = err.message;
        });

        return res.status(400).json({
            message: "Validation failed",
            errors: formattedErrors
        });
    }

    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await userModel.findOne({
            email: email
        });

        if (!user) {
            return res.status(403).json({
                message: "User doesn't exist. Please sign up"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({
                id: user._id.toHexString()
            }, JWT_SECRET,{expiresIn: "15m"});

            
            const refreshToken = jwt.sign({
                id: user._id.toHexString()
            },REFRESH_SECRET,{expiresIn: "1d"});

            // here we are storing refresh token in our data-base of user for handling long sessions

            user.refreshTokens.push(refreshToken);
            await user.save();

            // now we are storing refresh token in the cookies to increse the session time

            res.cookie("refreshToken",refreshToken,cookieOptions);
            
            res.cookie("token",token, cookieOptions)

            // here we are storing both token and refresh token in the browser rather than storing in n=the localstorage of the browser

            res.json({
                message: "Login Successfull"
            });

        } else {
            res.status(403).json({
                message: "Invalid credentials"
            });
        }
    } catch (err) {
        res.status(500).json({
            message: "Error during signin"
        });
    }
}

async function refreshHandler(req,res)
{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken)
    {
        return res.status(403).json({
            message: "No token provided"
        });
    }
    try {
        const decodedData = jwt.verify(refreshToken,REFRESH_SECRET);

        const user = await userModel.findById(decodedData.id); 

        // now we will check in database to avoid zombie Attack

        if(!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(403).json({
                message: "Session revoked or Invalid"
            })
        }

        //  now we will Generate new Acceess Token
        const newToken = jwt.sign({id: user._id.toHexString()}, JWT_SECRET,{expiresIn: "15m"});
        res.cookie("token",newToken,cookieOptions);
        res.status(200).json({
            message: "Token Updated"
        });
    } catch(err) {
        if (err.name === "TokenExpiredError") {
            const decodedData = jwt.decode(refreshToken);

            if (decodedData?.id) {
                await userModel.findByIdAndUpdate(decodedData.id, {
                    $pull : { refreshTokens: refreshToken}
                });
            }
        }
        res.status(401).json({
            message: "Session Expired"
        })
    }
}

async function logoutHandler(req,res) {
    const refreshToken = req.cookies.refreshToken;

    try {
        
        await userModel.findByIdAndUpdate(req.userId,{
            $pull: {refreshTokens: refreshToken}
        });

        res.clearCookie("token", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        res.json({
            message: "You are Logged Out"
        })
    } catch(err) {
        res.status(500).json({
            message: "Logout Failed"
        })
    }
}

async function alllogoutHandler(req,res) {
    
    const refreshToken = req.cookies.refreshToken;
    
    try {

        await userModel.findByIdAndUpdate(req.userId, {
            $set: {refreshTokens: []}
        });

        res.clearCookie("token", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        res.json({
            message: "Logged Out from all Devices"
        })
    } catch(err) {
        res.status(500).json({
            message: "Failed to Log out"
        });
    }
}
// This route handles users
async function getUserInfo(req, res) {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select('name email -_id');

        if (user) {
            res.json({
                name: user.name,
                email: user.email
            });
        } else {
            res.status(404).json({
                message: "User not found"
            });
        }
    } catch (err) {
        res.status(500).json({
            message: "Error fetching user info"
        });
    }
}

async function forgotPasswordHandler(req, res) {

    const requiredBody = z.object({
        email: z.string().email()
    });

    const parsed = requiredBody.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const { email } = parsed.data;

    try {
        const user = await userModel.findOne({ email });

        // 🔐 Don't reveal if user exists
        if (!user) {
            return res.json({
                message: "If account exists, OTP sent"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await otpModel.deleteMany({ email });

        await otpModel.create({
            email,
            otp: await bcrypt.hash(otp, 10),
            name: user.name,
            password: user.password // temp store
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP is ${otp}`
        });

        return res.json({
            message: "If account exists, OTP sent"
        });

    } catch (err) {
        return res.status(500).json({
            message: "Error sending OTP"
        });
    }
}

async function resetPasswordHandler(req, res) {

    const requiredBody = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
        newPassword: z.string().min(8)
    });

    const parsed = requiredBody.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const { email, otp, newPassword } = parsed.data;

    try {
        const record = await otpModel.findOne({ email }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        // expiry check
        const isExpired = (Date.now() - record.createdAt.getTime()) > 5*60*1000;
        if (isExpired) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        const isMatch = await bcrypt.compare(otp, record.otp);

        if (!isMatch) {
            await otpModel.updateOne(
                { _id: record._id },
                { $inc: { attempts: 1 } }
            );

            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        // 🔐 update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await userModel.updateOne(
            { email },
            { password: hashedPassword }
        );

        await otpModel.deleteMany({ email });

        return res.json({
            message: "Password reset successful"
        });

    } catch (err) {
        return res.status(500).json({
            message: "Error resetting password"
        });
    }
}

export {
    signupHandler,
    verifyOtpHandler,
    signinHandler,
    refreshHandler,
    logoutHandler,
    alllogoutHandler,
    getUserInfo,
    forgotPasswordHandler,
    resetPasswordHandler
};
