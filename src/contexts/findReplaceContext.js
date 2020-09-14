import React, { createContext, useState, useRef, useEffect, useContext } from 'react';

import { LeftNavContext } from './leftNavContext';

export const FindReplaceContext = createContext();

const FindReplaceContextProvider = (props) => {
	// STATE
	const [findText, setFindText] = useState('');
	const [showFindReplace, setShowFindReplace] = useState(true);
	const [replaceDefaultOn, setReplaceDefaultOn] = useState(false);
	const [refocusFind, setRefocusFind] = useState(false);
	const [refocusReplace, setRefocusReplace] = useState(false);
	const [findIndex, setFindIndex] = useState(null);

	// REF
	const findRegisterRef = useRef({});

	// CONTEXT
	const { currentDoc } = useContext(LeftNavContext).navData;

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

	// console.log(findText);

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
			}}>
			{props.children}
		</FindReplaceContext.Provider>
	);
};

export default FindReplaceContextProvider;
