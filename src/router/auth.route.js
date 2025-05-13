import { Router } from "express";
import { register, verifyOtp, resendOtp, login, updateUser, logOut, resetPasswordOtp, forgotPassowrd} from '../controllers/auth.control.js'
import { upload } from '../middleware/multer.middle.js';
import { verifyJwt } from '../middleware/auth.middle.js'


const authRouter = Router();

authRouter.route('/register').post(
   upload.single(
     'profilePhoto'
   ),
   register
);

authRouter.route('/verifyOtp').post(verifyOtp);

authRouter.route('/resendOtp').put(resendOtp);

authRouter.route('/login').post(login);

authRouter.route('/updateUser').put(verifyJwt,
   upload.single(
    'profilePhoto'
   ),
   updateUser
);

authRouter.route('/logOut').post(verifyJwt, logOut);

authRouter.route('/resetPasswordOtp').post(verifyJwt, resetPasswordOtp)

authRouter.route('/forgotPassowrd').put(verifyJwt, forgotPassowrd)


export default authRouter;