import React from 'react'
import { JsonRpcProvider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { injected } from './_app';
import { Box, Button, Center, Input, Text, VStack } from "@chakra-ui/react";
import { encrypt } from '@metamask/eth-sig-util';
import { encode, decode } from "@alttiri/base85";


const index = () => {

    const { active, activate, deactivate, account } = useWeb3React<JsonRpcProvider>();
    const [user, setUser] = React.useState({
        publicKey: "",
    })

    const [encodedData, setEncodedData] = React.useState({
        message: "Important Data",
        publicKeyOfReceiver: "",
        encodedMessage: ""
    })

    const [decodedData, setDecodedData] = React.useState({
        encodedMessage: "",
        message: "",
        senderAddress: "",
    })

    const connect = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                await activate(injected);
            } catch (e) {
                console.log(e);
            }
        } else {
            alert("Please use a web3 broswer/app");
        }
    };

    const requestPublicKey = async () => {
        // Account is account address provided as string
        // App must have access to the specified account

        if (account) {
            // Key is returned as base64
            const publicKey = await window.ethereum.request({
                method: 'eth_getEncryptionPublicKey',
                params: [account],
            }) as string;

            const publicKeyBuffer = Buffer.from(publicKey, 'base64');
            const publicKeyHex = publicKeyBuffer.toString("hex");
            setUser({ publicKey: publicKeyHex });

        }

    }

    const encryptData = async () => {
        // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
        // Each contains data encoded using base64, version is always the same string

        const publicKeyBuffer = Buffer.from(encodedData.publicKeyOfReceiver, "hex");
        const data = Buffer.from(encodedData.message);

        const encrypted = encrypt({
            publicKey: publicKeyBuffer.toString("base64"),
            data: encode(data),
            version: 'x25519-xsalsa20-poly1305',
        });

        console.log("encrypted: ", encrypted);

        // // We want to store the data in smart contract, therefore we concatenate them
        // // into single Buffer
        var buf = Buffer.concat([
            Buffer.from(encrypted.ephemPublicKey, 'base64'),
            Buffer.from(encrypted.nonce, 'base64'),
            Buffer.from(encrypted.ciphertext, 'base64'),
        ]);

        console.log("buf: ", buf);
        const hexBuffer = buf.toString("hex");
        console.log("hexBuffer: ", hexBuffer);
        setEncodedData((prev) => ({ ...prev, encodedMessage: hexBuffer }))

    }

    const decryptData = async () => {

        // Reconstructing the original object outputed by encryption
        const concatedBuffer = Buffer.from(decodedData.encodedMessage, "hex")
        const messageBuffer = Uint8Array.prototype.slice.call(concatedBuffer);

        const structuredData = {
            version: 'x25519-xsalsa20-poly1305',
            ephemPublicKey: Buffer.from(messageBuffer.slice(0, 32)).toString("base64"),
            nonce: Buffer.from(messageBuffer.slice(32, 56)).toString("base64"),
            ciphertext: Buffer.from(messageBuffer.slice(56)).toString("base64"),
        };

        // console.log("structuredData: ", structuredData);

        // // Convert data to hex string required by MetaMask
        const ct = `0x${Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;

        const decrypt = await window.ethereum.request({
            method: 'eth_decrypt',
            params: [ct, account],
        });

        // // Decode the base85 to final bytes
        const secretMessageUTF = decode(decrypt);
        const secretMessage = Buffer.from(secretMessageUTF).toString();
        setDecodedData((prev) => ({ ...prev, message: secretMessage }));


    }

    const Connected = () => {
        return (
            <Text>
                {account}
            </Text>
        );
    };

    const Connect = () => (
        <Button onClick={connect}>
            Connect Wallet
        </Button>
    );

    return (
        <div style={{ padding: "20px" }}>

            <div style={{ display: "flex", justifyContent: "end" }}>
                {!active && (
                    <Connect />
                )}

                {active && account && (
                    <Connected />
                )}
            </div>

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
                        value={encodedData.publicKeyOfReceiver}
                        type="text"
                        w="400px"
                        onChange={(e) => { setEncodedData((prev) => ({ ...prev, publicKeyOfReceiver: e.target.value })) }}
                        placeholder='PublicKey of user who will receive the message'
                    />

                    <Center>
                        <Button onClick={encryptData}> Encrypt Data </Button>
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

            <br /> <br /> <br />

            <VStack spacing={5}>

                <VStack>
                    <Input
                        type="text"
                        value={decodedData.encodedMessage}
                        w="400px"
                        onChange={(e) => { setDecodedData((prev) => ({ ...prev, encodedMessage: e.target.value })) }}
                        placeholder='Encrypted Message'
                    />
                    <Center>
                        <Button onClick={decryptData}> Decrypt Data </Button>
                    </Center>
                </VStack>

                {
                    decodedData.message && (
                        <Box>
                            <Text>Message: {decodedData.message} </Text>
                        </Box>
                    )
                }

            </VStack>

            <br /> <br /> <br />

            <Box>
                {
                    user.publicKey && (
                        <VStack>
                            <Text> <b>Your Public Key:</b> {user.publicKey} </Text>
                        </VStack>
                    )
                }

                {
                    !user.publicKey && (
                        <VStack>
                            <Text as="b">Request your Public Key</Text>
                            <Button onClick={requestPublicKey}>
                                Request Public Key
                            </Button>
                        </VStack>
                    )
                }
            </Box>


        </div>
    )
}

export default index