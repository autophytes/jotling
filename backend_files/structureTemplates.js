const docStructureTemplate = {
  projectName: 'Project Name',
  maxIds: { folder: 4, doc: 4 },
  draft: {
    folders: {
      '1': {
        folders: {},
        children: [{ type: 'doc', id: 1, name: 'Untitled', fileName: 'doc1.json' }],
      },
    },
    children: [{ type: 'folder', name: 'Chapter 1', id: 1 }],
  },
  research: {
    folders: {
      '2': {
        folders: {},
        children: [{ type: 'doc', id: 2, name: 'Untitled', fileName: 'doc2.json' }],
      },
    },
    children: [{ type: 'folder', id: 2, name: 'Research Folder' }],
  },
  pages: {
    folders: {
      '3': {
        folders: {},
        children: [{ type: 'doc', id: 3, name: 'Untitled', fileName: 'doc3.json' }],
      },
      '4': {
        folders: {},
        children: [{ type: 'doc', id: 4, name: 'Untitled', fileName: 'doc4.json' }],
      },
    },
    children: [
      { type: 'folder', id: 3, name: 'Characters' },
      { type: 'folder', id: 4, name: 'Locations' },
    ],
  },
  trash: []
};

const linkStructureTemplate = {
  docTags: {},
  tagLinks: {},
  links: {},
  docLinks: {},
};

module.exports = { docStructureTemplate, linkStructureTemplate };
