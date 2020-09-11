import React, { createContext, useState } from 'react';

export const FindReplaceContext = createContext();

const FindReplaceContextProvider = (props) => {
	// STATE
	const [findText, setFindText] = useState('');
	const [showFindReplace, setShowFindReplace] = useState(true);
	const [replaceDefaultOn, setReplaceDefaultOn] = useState(false);
	const [refocusFind, setRefocusFind] = useState(false);
	const [refocusReplace, setRefocusReplace] = useState(false);

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
			}}>
			{props.children}
		</FindReplaceContext.Provider>
	);
};

export default FindReplaceContextProvider;
