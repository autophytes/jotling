import React, {
	createContext,
	useState,
	useRef,
	useEffect,
	useContext,
	useCallback,
} from 'react';

import { LeftNavContext } from './leftNavContext';

export const FindReplaceContext = createContext();

const FindReplaceContextProvider = (props) => {
	// STATE
	const [findText, setFindText] = useState('');
	const [replaceText, setReplaceText] = useState('');
	const [showFindReplace, setShowFindReplace] = useState(true);
	const [replaceDefaultOn, setReplaceDefaultOn] = useState(false);
	const [refocusFind, setRefocusFind] = useState(false);
	const [refocusReplace, setRefocusReplace] = useState(false);
	const [findIndex, setFindIndex] = useState(null);
	const [totalMatches, setTotalMatches] = useState(0);
	const [replaceSingleQueue, setReplaceSingleQueue] = useState({});

	// REF
	const findRegisterRef = useRef({});
	const updateFindRegisterQueueRef = useRef(null);
	const updateReplaceRegisterQueueRef = useRef(null);

	// CONTEXT
	const { navData } = useContext(LeftNavContext);
	const currentDoc = navData.currentDoc;

	// Reset the findRegister when the findText or currentDoc changes
	useEffect(() => {
		setFindIndex(null);
		findRegisterRef.current[findText.toLowerCase()] = {
			array: [],
			register: {},
			blockList: {},
		};

		for (let key of Object.keys(findRegisterRef.current)) {
			if (key !== findText.toLowerCase()) {
				delete findRegisterRef.current[key];
			}
		}
	}, [findText, currentDoc]);

	const queueDecoratorUpdate = useCallback((findText) => {
		// Remove any queued updates to findRegisterRef
		clearTimeout(updateFindRegisterQueueRef.current);

		// Update the number of matches on the page
		updateFindRegisterQueueRef.current = setTimeout(() => {
			setTotalMatches(findRegisterRef.current[findText.toLowerCase()].array.length);
		}, 100);
	}, []);

	const queueReplaceUpdate = useCallback(() => {
		clearTimeout(updateReplaceRegisterQueueRef.current);

		updateReplaceRegisterQueueRef.current = setTimeout(() => {
			setReplaceSingleQueue({});
		}, 100);
	});

	return (
		<FindReplaceContext.Provider
			value={{
				findText,
				setFindText,
				showFindReplace,
				setShowFindReplace,
				replaceDefaultOn,
				setReplaceDefaultOn,
				refocusFind,
				setRefocusFind,
				refocusReplace,
				setRefocusReplace,
				findRegisterRef,
				findIndex,
				setFindIndex,
				queueDecoratorUpdate,
				totalMatches,
				queueReplaceUpdate,
				replaceText,
				setReplaceText,
				replaceSingleQueue,
				setReplaceSingleQueue,
			}}>
			{props.children}
		</FindReplaceContext.Provider>
	);
};

export default FindReplaceContextProvider;
