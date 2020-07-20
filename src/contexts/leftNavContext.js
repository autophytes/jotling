import React, { createContext, useState } from 'react';

export const LeftNavContext = createContext();

const defaultDocStructure3 = {
	projectName: 'Test Project',
	draft: {
		folders: {
			1: {
				folders: {
					6: { folders: {}, children: [] },
					7: {
						folders: {},
						children: [
							{ type: 'doc', name: 'Sub sub 1', id: 1, fileName: 'lan23h2f.json' },
							{ type: 'doc', name: 'Sub sub 2', id: 2, fileName: 'j20rhs0s.json' },
							{ type: 'doc', name: 'Sub sub 3', id: 3, fileName: '0gh20f8l.json' },
						],
					},
				},
				children: [
					{ type: 'folder', name: 'Sub 1', id: 6 },
					{ type: 'folder', name: 'Sub 2', id: 7 },
				],
			},
			2: { folders: {}, children: [] },
			3: { folders: {}, children: [] },
			4: { folders: {}, children: [] },
			5: { folders: {}, children: [] },
		},
		children: [
			{ type: 'folder', name: 'Chapter 1', id: 1 },
			{ type: 'folder', name: 'Chapter 2', id: 2 },
			{ type: 'folder', name: 'Chapter 3', id: 3 },
			{ type: 'folder', name: 'Chapter 4', id: 4 },
			{ type: 'folder', name: 'Chapter 5', id: 5 },
		],
	},
	research: {
		folders: {},
		children: [],
	},
	pages: {
		folders: {},
		children: [],
	},
};

const LeftNavContextProvider = (props) => {
	const [docStructure, setDocStructure] = useState(defaultDocStructure3);
	const [navData, setNavData] = useState({
		currentProj: 'Test Project',
		currentDoc: 'x023jfsf.jots',
		currentTab: 'draft',
		lastClicked: { type: '', id: '' },
		editFile: '',
	});

	return (
		<LeftNavContext.Provider value={{ docStructure, setDocStructure, navData, setNavData }}>
			{props.children}
		</LeftNavContext.Provider>
	);
};

export default LeftNavContextProvider;
