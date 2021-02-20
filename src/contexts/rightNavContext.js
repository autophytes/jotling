import React, { createContext, useState } from 'react';

export const RightNavContext = createContext();

const RightNavContextProvider = (props) => {
	// STATE
	const [newTagTemplate, setNewTagTemplate] = useState('');

	return (
		<RightNavContext.Provider value={{ newTagTemplate, setNewTagTemplate }}>
			{props.children}
		</RightNavContext.Provider>
	);
};

export default RightNavContextProvider;
