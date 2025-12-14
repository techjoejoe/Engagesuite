import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export interface ToolState {
    type: 'dice' | 'coin' | 'buzzer';
    active: boolean;
    data: any;
    updatedAt?: any;
}

export const updateToolState = async (classId: string, toolId: string, state: Partial<ToolState>) => {
    const toolRef = doc(db, 'classes', classId, 'tools', toolId);
    await setDoc(toolRef, {
        ...state,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const onToolChange = (classId: string, toolId: string, callback: (state: ToolState | null) => void) => {
    const toolRef = doc(db, 'classes', classId, 'tools', toolId);
    return onSnapshot(toolRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as ToolState);
        } else {
            callback(null);
        }
    });
};
