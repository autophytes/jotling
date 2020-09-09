import React, { createContext, useState } from 'react';

export const FindReplaceContext = createContext();

const FindReplaceContextProvider = (props) => {
	// STATE
	const [findText, setFindText] = useState('');

	return (
		<FindReplaceContext.Provider
			value={{
				findText,
				setFindText,
			}}>
			{props.children}
		</FindReplaceContext.Provider>
	);
};

export default FindReplaceContextProvider;
