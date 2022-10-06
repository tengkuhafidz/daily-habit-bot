import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { appConfig } from "../configs/appConfig.ts";
import { tzMoment } from "../utils/tzMoment.ts";

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
        const datesDocRef = doc(datesColRef, tzMoment().format('DDMMYYYY'))

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
        const datesDocRef = doc(datesColRef, tzMoment().format('DDMMYYYY'))

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
        const datesDocRef = doc(datesColRef, tzMoment().format('DDMMYYYY'))

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
    if (!reminderTime) {
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



const getChallengeStats = async (chatId: string, fromDate?: Date, toDate?: Date) => {
    try {
        const challengesDocRef = doc(db, "challenges", chatId)
        let myQuery = collection(challengesDocRef, "dates")

        if (fromDate) {
            myQuery = query(myQuery, where("createdAt", ">=", fromDate))
        }

        if (toDate) {
            myQuery = query(myQuery, where("createdAt", "<=", toDate))
        }

        const mySnapshot = await getDocs(myQuery);
        const challengesFromDate: any[] = []

        mySnapshot.forEach((myDoc) => {
            const challengesByDate = myDoc.data()
            challengesFromDate.push({
                ...challengesByDate,
            })
        });

        return challengesFromDate
    } catch (e) {
        console.log("createToday ERROR:", e)
    }
}

const saveReminderTiming = async (chatId: string, reminderTiming: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)
        await updateDoc(docRef, {
            reminderTiming,
            updatedAt: new Date()
        })
    } catch (e) {
        console.log("removeReminderTiming ERROR:", e)
    }
}

const removeReminderTiming = async (chatId: string) => {
    try {
        const docRef = doc(db, "challenges", chatId)
        await updateDoc(docRef, {
            reminderTiming: deleteField(),
            updatedAt: new Date()

        })
    } catch (e) {
        console.log("removeReminderTiming ERROR:", e)
    }
}

export const queries = {
    getChallenge,
    saveChallenge,
    joinChallenge,
    deleteChallenge,
    setDone,
    getToday,
    createToday,
    getChallengesToBeReminded,
    getChallengeStats,
    saveReminderTiming,
    removeReminderTiming
}