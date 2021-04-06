import React, { createContext, useState } from 'react';

export const RightNavContext = createContext();

const RightNavContextProvider = (props) => {
	// STATE
	const [newTagTemplate, setNewTagTemplate] = useState('');
	const [activeTab, setActiveTab] = useState('tags');
	const [scrollToCommentId, setScrollToCommentId] = useState(null);
	const [focusCommentId, setFocusCommentId] = useState(null);

	return (
		<RightNavContext.Provider
			value={{
				newTagTemplate,
				setNewTagTemplate,
				activeTab,
				setActiveTab,
				scrollToCommentId,
				setScrollToCommentId,
				focusCommentId,
				setFocusCommentId,
			}}>
			{props.children}
		</RightNavContext.Provider>
	);
};

export default RightNavContextProvider;
