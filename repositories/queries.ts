import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { appConfig } from "../configs/appConfig.ts";

const firebaseApp = initializeApp(appConfig.firebaseConfig);
const db = getFirestore(firebaseApp);

const getChallenge = async (chatId: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)
        const docSnap = await getDoc(docRef);
        return docSnap.data()
    } catch (error) {
        console.log(error)
    }
}

const saveChallenge = async (chatId: string, challengeName: string) => {
    try {
        const dbRef = doc(db, "challenges", chatId)
        await setDoc(dbRef, { name: challengeName, createdAt: new Date(), updatedAt: new Date(), participants: null });
    } catch (e) {
        console.log(">>> e", e)
        return null
    }
}

const joinChallenge = async (chatId: string, userId: number, userName: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)

        const data = {
            [`participants.${userId}`]: userName,
            updatedAt: new Date()
        }

        await updateDoc(docRef, data);
    } catch (e) {
        console.log("ERROR ", e)
    }
}

const deleteChallenge = async (chatId: string) => {
    const challengesDocRef = doc(db, "challenges", chatId)
    const datesColRef = collection(challengesDocRef, "dates")

    const querySnapshot = await getDocs(datesColRef)
    const toBeDeleted: any[] = [];
    querySnapshot.forEach((doc) => {
        toBeDeleted.push(deleteDoc(doc.ref));
    });
    Promise.all(toBeDeleted).then(() => console.log('documents deleted'))

    await deleteDoc(challengesDocRef)
}

const getToday = async (chatId: string) => {
    const challengesDocRef = doc(db, "challenges", chatId)
    const datesColRef = collection(challengesDocRef, "dates")
    const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

    const docSnap = await getDoc(datesDocRef);

    return docSnap.data()
}

const createToday = async (chatId: string) => {
    const challengesDocRef = doc(db, "challenges", chatId)
    const datesColRef = collection(challengesDocRef, "dates")
    const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

    const data = {
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    await setDoc(datesDocRef, data, { merge: true });
}

const setDone = async (chatId: string, userId: number) => {
    const challengesDocRef = doc(db, "challenges", chatId)
    const datesColRef = collection(challengesDocRef, "dates")
    const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

    const data = {
        [`participants.${userId}`]: true,
        updatedAt: new Date()
    }

    await updateDoc(datesDocRef, data, { merge: true });
}

export const queries = {
    getChallenge,
    saveChallenge,
    joinChallenge,
    deleteChallenge,
    setDone,
    getToday,
    createToday
}