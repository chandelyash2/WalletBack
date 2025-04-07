import { body } from 'express-validator';


const createUser = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
    body('username').not().isEmpty().withMessage('@Username is required'),
]

const recoverByPhrase = [
    body('secretPhrase').not().isEmpty().withMessage('Secret phrase is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
]

const recoverByPrivateKey = [
    body('privateKey').not().isEmpty().withMessage('Private key is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
]

const updateUser = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required')
]

const getUser = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required')
]

const getTokens = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required'),
    body('network').not().isEmpty().withMessage('network is required'),
]

const setPin = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required'),
    body('pin').not().isEmpty().withMessage('Transaction pin is required')
]

const verify2Fa = [
    body('token').not().isEmpty().withMessage('token is required'),
    body('userSecret').not().isEmpty().withMessage('User secret is required'),
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required')
]

const validate2Fa = [
    body('walletAddress').not().isEmpty().withMessage('Wallet address is required'),
    body('token').not().isEmpty().withMessage('token is required')
]


export {
    createUser,
    recoverByPhrase,
    updateUser,
    recoverByPrivateKey,
    getUser,
    getTokens,
    setPin,
    verify2Fa,
    validate2Fa
};
