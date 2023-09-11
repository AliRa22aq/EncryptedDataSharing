import React, { useState, useEffect } from 'react'
import { Box, Button, Center, Input, Text, VStack } from "@chakra-ui/react";
import EthCrypto from 'eth-crypto';

const Home = () => {

    const [users, setUsers] = useState({
        user1: {
            privateKey: "",
            publicKey: "",
            address: ""
        },
        user2: {
            privateKey: "",
            publicKey: "",
            address: ""
        }
    })

    const [encodedData, setEncodedData] = useState({
        message: "",
        privateKeyOfSender: "",
        publicKeyOfReceiver: "",
        encodedMessage: ""
    })

    const [decodedData, setDecodedData] = useState({
        encodedMessage: "",
        privateKeyOfReceiver: "",
        message: "",
        senderAddress: "",
    })

    const createItendidties = async () => {
        const user1 = EthCrypto.createIdentity();
        const user2 = EthCrypto.createIdentity();
        setUsers({ user1, user2 });
    }

    useEffect(() => {
        createItendidties();
    }, [])

    const handleEncodedData = async () => {
        const secretMessage = encodedData.message;
        const privateKeyOfSender = encodedData.privateKeyOfSender;
        const publicKeyOfReceiver = encodedData.publicKeyOfReceiver;


        const signature = EthCrypto.sign(
            privateKeyOfSender,
            EthCrypto.hash.keccak256(secretMessage)
        );
        const payload = {
            message: secretMessage,
            signature
        };
        const encrypted = await EthCrypto.encryptWithPublicKey(
            publicKeyOfReceiver, // by encrypting with bobs publicKey, only bob can decrypt the payload with his privateKey
            JSON.stringify(payload) // we have to stringify the payload before we can encrypt it
        );
        /*  { iv: 'c66fbc24cc7ef520a7...',
          ephemPublicKey: '048e34ce5cca0b69d4e1f5...',
          ciphertext: '27b91fe986e3ab030...',
          mac: 'dd7b78c16e462c42876745c7...'
            }
        */
        
        // we convert the object into a smaller string-representation
        const encryptedString = EthCrypto.cipher.stringify(encrypted);
        setEncodedData((prev) => ({ ...prev, encodedMessage: encryptedString }))
        

    }

    const handleDecodedData = async () => {
        const privateKeyOfReceiver = decodedData.privateKeyOfReceiver
        const encryptedString = decodedData.encodedMessage;


        const encryptedObject = EthCrypto.cipher.parse(encryptedString);

        const decrypted = await EthCrypto.decryptWithPrivateKey(
            privateKeyOfReceiver,
            encryptedObject
        );
        const decryptedPayload = JSON.parse(decrypted);
        
        // check signature
        const senderAddress = EthCrypto.recover(
            decryptedPayload.signature,
            EthCrypto.hash.keccak256(decryptedPayload.message)
        );
        
        console.log(
            'Got message from ' +
            senderAddress +
            ': ' +
            decryptedPayload.message
        );
        // > 'Got message from 0x19C24B2d99FB91C5...: "My name is Satoshi Buterin" Buterin'
        setDecodedData((prev) => ({ ...prev, message: decryptedPayload.message, senderAddress }))
    }

    return (
        <div style={{ padding: "20px" }}>

            <VStack spacing={5}>
                
                <VStack>
                    <Text> As User 1</Text>
                    <Input
                        value={encodedData.message}
                        type="text"
                        w="400px"
                        onChange={(e) => { setEncodedData((prev) => ({ ...prev, message: e.target.value })) }}
                        placeholder='Message'
                    />
                    <Input
                        value={encodedData.privateKeyOfSender}
                        type="text"
                        w="400px"
                        onChange={(e) => { setEncodedData((prev) => ({ ...prev, privateKeyOfSender: e.target.value })) }}
                        placeholder='PrivateKey of user who is sending the message'
                    />
                    <Input
                        value={encodedData.publicKeyOfReceiver}
                        type="text"
                        w="400px"
                        onChange={(e) => { setEncodedData((prev) => ({ ...prev, publicKeyOfReceiver: e.target.value })) }}
                        placeholder='PublicKey of user who will receive the message'
                    />

                    <Center>
                        <Button onClick={handleEncodedData}> encode </Button>
                    </Center>

                </VStack>

                {
                    encodedData.encodedMessage && (
                        <Box w="80%" mx="auto">
                            <Text>Encrypted Message: {encodedData.encodedMessage}</Text>
                        </Box>
                    )
                }

            </VStack>

            <br />
            <br />
            <br />

            <VStack spacing={5}>

                <VStack>
                    <Input
                        type="text"
                        value={decodedData.encodedMessage}
                        w="400px"
                        onChange={(e) => { setDecodedData((prev) => ({ ...prev, encodedMessage: e.target.value })) }}
                        placeholder='Encrypted Message'
                    />
                    <Input
                        type="text"
                        value={decodedData.privateKeyOfReceiver}
                        w="400px"
                        onChange={(e) => { setDecodedData((prev) => ({ ...prev, privateKeyOfReceiver: e.target.value })) }}
                        placeholder='PrivateKey of user who received the message'
                    />

                    <Center>
                        <Button onClick={handleDecodedData}> decode </Button>
                    </Center>
                </VStack>

                {
                    decodedData.message && (
                        <Box>
                            <Text>Message: {decodedData.message} </Text>
                            <Text>Sent by: {decodedData.senderAddress} </Text>
                        </Box>
                    )
                }

            </VStack>
            
            <br />
            <br />
            <br />

            <Box>
                <Text>User 1</Text>
                <Text>Address: {users.user1.address}</Text>
                <Text>PublicKey: {users.user1.publicKey}</Text>
                <Text>privateKey: {users.user1.privateKey}</Text>
            </Box>
            <br />
            <Box>
                <Text>User 2</Text>
                <Text>Address: {users.user2.address}</Text>
                <Text>PublicKey: {users.user2.publicKey}</Text>
                <Text>privateKey: {users.user2.privateKey}</Text>
            </Box>


        </div>
    )
}

export default Home