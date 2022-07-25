import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { appConfig } from "../configs/appConfig.ts";

const firebaseApp = initializeApp(appConfig.firebaseConfig);
const db = getFirestore(firebaseApp);

const getChallenge = async (chatId: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)
        const docSnap = await getDoc(docRef);
        return docSnap.data()
    } catch (error) {
        console.log("getChallenge ERROR:", error)
    }
}

const saveChallenge = async (chatId: string, challengeName: string) => {
    try {
        const dbRef = doc(db, "challenges", chatId)
        await setDoc(dbRef, { name: challengeName, createdAt: new Date(), updatedAt: new Date(), participants: null });
    } catch (e) {
        console.log("saveChallenge ERROR:", e)
        return null
    }
}

const joinChallenge = async (chatId: string, userId: string, userName: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)

        const data = {
            [`participants.${userId}`]: userName,
            updatedAt: new Date()
        }

        await updateDoc(docRef, data);
    } catch (e) {
        console.log("joinChallenge ERROR:", e)
    }
}

const deleteChallenge = async (chatId: string) => {
    try {
        const challengesDocRef = doc(db, "challenges", chatId)
        const datesColRef = collection(challengesDocRef, "dates")
        const querySnapshot = await getDocs(datesColRef)
        const toBeDeleted: any[] = [];
        querySnapshot.forEach((doc) => {
            toBeDeleted.push(deleteDoc(doc.ref));
        });
        Promise.all(toBeDeleted).then(() => console.log('documents deleted'))

        await deleteDoc(challengesDocRef)
    } catch (e) {
        console.log("deleteChallenge ERROR:", e)
    }
}

const getToday = async (chatId: string) => {
    try {
        const challengesDocRef = doc(db, "challenges", chatId)
        const datesColRef = collection(challengesDocRef, "dates")
        const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

        const docSnap = await getDoc(datesDocRef);

        return docSnap.data()
    } catch (e) {
        console.log("createToday ERROR:", e)
    }
}

const createToday = async (chatId: string) => {
    try {
        const challengesDocRef = doc(db, "challenges", chatId)
        const datesColRef = collection(challengesDocRef, "dates")
        const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

        const data = {
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        await setDoc(datesDocRef, data, { merge: true });
    } catch (e) {
        console.log("createToday ERROR:", e)
    }
}

const setDone = async (chatId: string, userId: string) => {
    try {
        const challengesDocRef = doc(db, "challenges", chatId)
        const datesColRef = collection(challengesDocRef, "dates")
        const datesDocRef = doc(datesColRef, moment().format('DDMMYYYY'))

        const data = {
            [`participants.${userId}`]: true,
            updatedAt: new Date()
        }

        await updateDoc(datesDocRef, data, { merge: true });
    } catch (e) {
        console.log("setDone ERROR:", e)
    }
}

const getChallengesToBeReminded = async (reminderTime?: string) => {
    if(!reminderTime) {
        return
    }
    const colRef = collection(db, "challenges")
    const myQuery = query(colRef, where("reminderTiming", "==", reminderTime))
    const mySnapshot = await getDocs(myQuery);
    const toBeReminded: any[] = []
    mySnapshot.forEach((myDoc) => {
        const challengeRecord = myDoc.data()
        const challengeId = myDoc.id

        toBeReminded.push({
            ...challengeRecord,
            chatId: challengeId
        })
    });

    return toBeReminded
}

export const queries = {
    getChallenge,
    saveChallenge,
    joinChallenge,
    deleteChallenge,
    setDone,
    getToday,
    createToday,
    getChallengesToBeReminded
}