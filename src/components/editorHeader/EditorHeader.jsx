import React, { useContext, useEffect, useState } from 'react';
import { LeftNavContext } from '../../contexts/leftNavContext';
import { SettingsContext } from '../../contexts/settingsContext';
import EditorHeaderTitle from './EditorHeaderTitle';
import EditorTableOfContents from './EditorTableOfContents';

const EditorHeader = () => {
	const [showTable, setShowTable] = useState(false);

	const { navData } = useContext(LeftNavContext);
	const { editorHeaderPaddingWrapperRef, editorSettings } = useContext(SettingsContext);

	// Determine whether to display the table of contents
	useEffect(() => {
		if (navData.currentDocTab === 'pages') {
			setShowTable(true);
		} else {
			setShowTable(false);
		}
	}, [navData]);

	return (
		<div
			className='editor-header'
			ref={editorHeaderPaddingWrapperRef}
			style={{ padding: `0 ${editorSettings.editorPadding}rem` }}>
			<EditorHeaderTitle />
			{/* Eventually, Table of Contents */}
			{showTable && <EditorTableOfContents />}
		</div>
	);
};

// <div className='editor-top-padding' />)
export default EditorHeader;
