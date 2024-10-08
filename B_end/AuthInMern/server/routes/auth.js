const router = require("express").Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// upgrade to redis
const USER_OTP = new Map()

router.post("/login", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const user = await User.findOne({ email: req.body.email });
		if (!user)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const validPassword = await bcrypt.compare(
			req.body.password,
			user.password
		);
		if (!validPassword)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const token = user.generateAuthToken();
		res.status(200).send({ data: token, message: "logged in successfully" });
	} catch (error) {
		console.log(error)
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.post('/sendLoginOtp', async (req, res) => {
	try {
		const { email } = req.body
		const user = await User.findOne({ email });
		if (!user)
			return res.status(401).send({ message: "User does not exsists." });
		const otp = (Math.floor(100000 + Math.random() * 900000)).toString()
		USER_OTP.set(email, otp)

		/// send otp through email

		res.status(200).json({
			message: "Otp sent successfully"
		})

		console.log(USER_OTP)

	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
})

router.post("/loginOtp", async (req, res) => {
	try {
		const { email, otp } = req.body

		const validOtp = USER_OTP.get(email)

		if (!validOtp || validOtp !== otp)
			return res.status(400).send({ message: "Invalid Otp." });

		const user = await User.findOne({ email: req.body.email });

		const token = user.generateAuthToken();

		USER_OTP.delete(email)
		console.log(USER_OTP)

		res.status(200).send({ data: token, message: "logged in successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.post('/sendForgetPasswordToken', async (req, res) => {
	try {
		const { email } = req.body

		const user = await User.findOne({ email });
		if (!user)
			return res.status(401).send({ message: "User does not exsists." });

		const token = jwt.sign({ email }, process.env.JWTPRIVATEKEY, { expiresIn: '5m' })
		console.log({ token })

		// send token through email

		res.status(200).json({
			message: "email sent successfully"
		})

	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
})

router.post('/changePassword', async (req, res) => {
	try {
		const { token } = req.query
		const { password } = req.body

		const { email } = jwt.decode(token, process.env.JWTPRIVATEKEY)

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(password, salt);

		const updateUser = await User.findOneAndUpdate({ email }, {
			password: hashPassword
		})

		res.status(200).json({
			message: "password changed successfully"
		})

	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
})

const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = router;


// login with otp
// 1. /sendLoginOtp -> save otp in redis/ store locally corresponding to email
// 2. /LoginOtp -> i/p email, otp verify then send jwt

// 3. /sendForgetPasswordToken -> create a jwt token with payload email, expire in 5min, send token
// 4. /changePassword -> take token as query, verify token, change password