import { useState, useMemo, useRef, useEffect } from 'react';
import { Layout, Tree, Button, Empty, TreeProps, Select } from 'antd';
import { ArrowLeftOutlined, FileOutlined, FolderOutlined, SortAscendingOutlined, VerticalAlignTopOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useFiles } from '../hooks/useFiles';
import MarkdownReader from '../components/reader/MarkdownReader';
import type { DataNode } from 'antd/es/tree';
import type { Key } from 'react';

const { Sider, Content } = Layout;

type SortBy = 'name' | 'modifiedAt' | 'size';

const sortOptions = [
  { value: 'name', label: '按名称' },
  { value: 'modifiedAt', label: '按修改时间' },
  { value: 'size', label: '按大小' },
];

export default function DirectoryBrowser() {
  const { dirPath } = useParams<{ dirPath: string }>();
  const navigate = useNavigate();
  const { files } = useFiles();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showBackTop, setShowBackTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const decodedDirPath = dirPath ? decodeURIComponent(dirPath) : '';

  const directoryFiles = useMemo(() => {
    if (!files || !decodedDirPath) return [];
    return files.filter(f => f.path.startsWith(decodedDirPath + '/'));
  }, [files, decodedDirPath]);

  const selectedFile = useMemo(() => {
    if (!selectedFileId || !files) return null;
    return files.find(f => f.id === selectedFileId) || null;
  }, [selectedFileId, files]);

  const parseMarkdownHeadings = (content: string): Array<{ level: number; text: string; id: string }> => {
    const headings: Array<{ level: number; text: string; id: string }> = [];
    if (!content) return headings;

    const lines = content.split('\n');
    const headingRegex = /^(#{1,6})\s+(.+)$/;

    lines.forEach((line) => {
      const match = line.match(headingRegex);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
        headings.push({ level, text, id });
      }
    });

    return headings;
  };

  const buildHeadingTree = (headings: Array<{ level: number; text: string; id: string }>): DataNode[] => {
    if (headings.length === 0) return [];

    const tree: DataNode[] = [];
    const stack: { children: DataNode[]; level: number }[] = [{ children: tree, level: 0 }];

    headings.forEach((heading, index) => {
      const node: DataNode = {
        key: `heading-${index}`,
        title: heading.text,
        children: [],
      };

      while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      parent.children!.push(node);

      stack.push({ children: node.children!, level: heading.level });
    });

    const markLeaves = (nodes: DataNode[]): DataNode[] => {
      return nodes.map(node => {
        if (!node.children || node.children.length === 0) {
          return { ...node, isLeaf: true, children: undefined };
        }
        return { ...node, children: markLeaves(node.children) };
      });
    };

    return markLeaves(tree);
  };

  const buildDirectoryTree = (): DataNode[] => {
    if (!directoryFiles || directoryFiles.length === 0) return [];

    const treeMap = new Map<string, DataNode & { _sortData?: { name: string; modifiedAt: number; size: number; isFolder: boolean } }>();

    directoryFiles.forEach(file => {
      const relativePath = file.path.slice(decodedDirPath.length + 1);
      const parts = relativePath.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!treeMap.has(currentPath)) {
          if (isLast) {
            treeMap.set(currentPath, {
              key: file.id,
              title: part,
              isLeaf: true,
              icon: <FileOutlined />,
              _sortData: { name: part, modifiedAt: file.modifiedAt, size: file.size, isFolder: false },
            });
          } else {
            treeMap.set(currentPath, {
              key: currentPath,
              title: part,
              isLeaf: false,
              icon: <FolderOutlined />,
              children: [],
              _sortData: { name: part, modifiedAt: 0, size: 0, isFolder: true },
            });
          }
        } else if (!isLast) {
          const existing = treeMap.get(currentPath)!;
          existing._sortData = { ...existing._sortData!, isFolder: true };
        }
      });
    });

    const rootNodes: (DataNode & { _sortData?: { name: string; modifiedAt: number; size: number; isFolder: boolean } })[] = [];
    treeMap.forEach((node, key) => {
      const lastSlashIndex = key.lastIndexOf('/');
      const parentKey = lastSlashIndex > -1 ? key.substring(0, lastSlashIndex) : null;

      if (parentKey && treeMap.has(parentKey)) {
        const parentNode = treeMap.get(parentKey);
        if (parentNode && parentNode.children) {
          parentNode.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: typeof rootNodes): DataNode[] => {
      const sorted = [...nodes].sort((a, b) => {
        const aData = a._sortData || { name: '', modifiedAt: 0, size: 0, isFolder: false };
        const bData = b._sortData || { name: '', modifiedAt: 0, size: 0, isFolder: false };

        if (aData.isFolder !== bData.isFolder) {
          return aData.isFolder ? -1 : 1;
        }

        switch (sortBy) {
          case 'modifiedAt':
            return bData.modifiedAt - aData.modifiedAt;
          case 'size':
            return bData.size - aData.size;
          default:
            return aData.name.localeCompare(bData.name, 'zh-CN');
        }
      });

      return sorted.map(node => {
        const { _sortData, ...rest } = node;
        if (rest.children && rest.children.length > 0) {
          return { ...rest, children: sortNodes(rest.children as typeof rootNodes) };
        }
        return rest;
      });
    };

    return sortNodes(rootNodes);
  };

  const handleFileSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
    if (info.node.isLeaf) {
      setSelectedFileId(selectedKeys[0] as string);
    }
  };

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleScroll = () => {
    if (contentRef.current) {
      setShowBackTop(contentRef.current.scrollTop > 200);
    }
  };

  const handleBackTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0 });
      setShowBackTop(false);
    }
  }, [selectedFileId]);

  const headings = selectedFile?.content ? parseMarkdownHeadings(selectedFile.content) : [];
  const headingTree = buildHeadingTree(headings);
  const directoryTree = useMemo(() => buildDirectoryTree(), [directoryFiles, sortBy]);

  if (!directoryFiles || directoryFiles.length === 0) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="该目录下没有文件" />
          <Button type="primary" onClick={handleBack} style={{ marginTop: 16 }}>
            返回首页
          </Button>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={260}
        theme="light"
        style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {decodedDirPath.split('/').pop() || '根目录'}
          </span>
        </div>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SortAscendingOutlined style={{ color: '#666' }} />
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            style={{ flex: 1 }}
            size="small"
          />
        </div>
        <div style={{ padding: '12px' }}>
          <Tree
            showLine
            showIcon
            treeData={directoryTree}
            onSelect={handleFileSelect}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            selectedKeys={selectedFileId ? [selectedFileId] : []}
            defaultExpandAll
          />
        </div>
      </Sider>

      <Layout style={{ marginLeft: 260, marginRight: headingTree.length > 0 ? 280 : 0 }}>
        <Content style={{ height: '100vh', position: 'relative' }}>
          <div
            ref={contentRef}
            style={{ padding: '24px', overflow: 'auto', height: '100%' }}
          >
            {selectedFile ? (
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h2 style={{ marginBottom: 24 }}>{selectedFile.name}</h2>
                <MarkdownReader file={selectedFile} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Empty description="请选择一个文件查看" />
              </div>
            )}
          </div>
          {showBackTop && (
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<VerticalAlignTopOutlined />}
              onClick={handleBackTop}
              style={{ position: 'fixed', bottom: 32, right: headingTree.length > 0 ? 300 : 32, zIndex: 1000 }}
            />
          )}
        </Content>
      </Layout>

      {selectedFile && headingTree.length > 0 && (
        <Sider
          width={280}
          theme="light"
          style={{ overflow: 'auto', height: '100vh', position: 'fixed', right: 0, top: 0, borderLeft: '1px solid #f0f0f0' }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>目录</h3>
          </div>
          <div style={{ padding: '12px' }}>
            <Tree
              treeData={headingTree}
              onSelect={(_, info) => {
                if (info.node) {
                  const key = info.node.key as string;
                  const index = parseInt(key.replace('heading-', ''));
                  if (headings[index]) {
                    handleHeadingClick(headings[index].id);
                  }
                }
              }}
              defaultExpandAll
              style={{ fontSize: 13 }}
            />
          </div>
        </Sider>
      )}
    </Layout>
  );
}
