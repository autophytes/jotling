import React, { createContext, useState } from 'react';

export const RightNavContext = createContext();

const RightNavContextProvider = (props) => {
	// STATE
	const [newTagTemplate, setNewTagTemplate] = useState('');
	const [activeTab, setActiveTab] = useState('tags');

	return (
		<RightNavContext.Provider
			value={{ newTagTemplate, setNewTagTemplate, activeTab, setActiveTab }}>
			{props.children}
		</RightNavContext.Provider>
	);
};

export default RightNavContextProvider;
