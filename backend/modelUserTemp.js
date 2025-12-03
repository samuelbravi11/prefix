import express from 'express';
import User from './models/user.js'; // get our mongoose model
const router = express.Router();

/**
 * Resource representation based on the following the pattern: 
 * https://cloud.google.com/blog/products/application-development/api-design-why-you-should-use-links-not-keys-to-represent-relationships-in-apis
 */
router.get('', async (req, res) => {
    // https://mongoosejs.com/docs/api.html#model_Model.find
    let users = await User.find({});
    users = users.map( (user) => {
        return {
            self: '/api/v1/users/' + user.id,
            title: user.title
        };
    });
    res.status(200).json(users);
});

router.use('/:id', async (req, res, next) => {
    // https://mongoosejs.com/docs/api.html#model_Model.findById
    let user = await user.findById(req.params.id).exec();
    if (!user) {
        res.status(404).send()
        console.log('user not found')
        return;
    }
    req['user'] = user;
    next()
});

router.get('/:id', async (req, res) => {
    let user = req['user'];
    res.status(200).json({
        self: '/api/v1/users/' + user.id,
        title: user.title
    });
});

router.delete('/:id', async (req, res) => {
    let user = req['user'];
    await user.deleteOne({ _id: req.params.id });
    console.log('user removed')
    res.status(204).send()
});

router.post('', async (req, res) => {

	let user = new user({
        title: req.body.title
    });
    
	user = await user.save();
    
    let userId = user._id;

    console.log('user saved successfully');

    /**
     * Link to the newly created resource is returned in the Location header
     * https://www.restapitutorial.com/lessons/httpmethods.html
     */
    res.location("/api/v1/users/" + userId).status(201).send();
});


export default router;