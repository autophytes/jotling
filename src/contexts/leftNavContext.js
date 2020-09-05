import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

export const LeftNavContext = createContext();

// CONSTANTS
const DEFAULT_WIDTH = 12;

const LeftNavContextProvider = (props) => {
	// STATE
	const [docStructure, setDocStructure] = useState({});
	const [linkStructure, setLinkStructure] = useState({});
	const [project, setProject] = useState({ tempPath: '', jotsPath: '' });
	const [navData, setNavData] = useState({
		currentDoc: '',
		currentTempPath: '',
		currentTab: 'draft',
		lastClicked: { type: '', id: '' },
		editFile: '',
		parentFolders: [],
	});
	const [editorStyles, setEditorStyles] = useState({
		leftNav: DEFAULT_WIDTH,
		leftIsPinned: true,
		rightNav: DEFAULT_WIDTH,
		rightIsPinned: true,
		editorMaxWidth: 60,
		showAllTags: false,
		showIndTags: [],
	});
	const [editorArchives, setEditorArchives] = useState({});
	const [scrollToLinkId, setScrollToLinkId] = useState(null);

	// REFS
	const linkStructureRef = useRef(linkStructure);
	const editorStateRef = useRef(null);
	const scrollToLinkIdRef = useRef(null);

	useEffect(() => {
		linkStructureRef.current = linkStructure;
	}, [linkStructure]);

	// Resets the width of the side nav bars
	const resetNavWidth = useCallback(
		(whichNav) => {
			setEditorStyles({ ...editorStyles, [whichNav]: DEFAULT_WIDTH });
		},
		[editorStyles]
	);

	return (
		<LeftNavContext.Provider
			value={{
				docStructure,
				setDocStructure,
				navData,
				setNavData,
				project,
				setProject,
				linkStructure,
				setLinkStructure,
				editorStyles,
				setEditorStyles,
				resetNavWidth,
				editorArchives,
				setEditorArchives,
				linkStructureRef,
				editorStateRef,
				scrollToLinkId,
				setScrollToLinkId,
				scrollToLinkIdRef,
			}}>
			{props.children}
		</LeftNavContext.Provider>
	);
};

export default LeftNavContextProvider;
