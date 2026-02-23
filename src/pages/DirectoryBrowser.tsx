import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Layout, Tree, Button, Empty, TreeProps, Select, Drawer } from 'antd';
import { ArrowLeftOutlined, FileOutlined, FolderOutlined, SortAscendingOutlined, VerticalAlignTopOutlined, UnorderedListOutlined, OrderedListOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useFiles } from '../hooks/useFiles';
import { recordReadingHistory, updateFileReadingProgress, getFileReadingProgress } from '../services/readingHistoryService';
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

const MOBILE_BREAKPOINT = 768;

export default function DirectoryBrowser() {
  const { dirPath } = useParams<{ dirPath: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { files } = useFiles();
  
  const initialFileId = searchParams.get('fileId');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(initialFileId);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showBackTop, setShowBackTop] = useState(false);
  const [leftDrawerVisible, setLeftDrawerVisible] = useState(false);
  const [rightDrawerVisible, setRightDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const saveProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentProgressRef = useRef<{ fileId: string; progress: number; scrollPosition: number } | null>(null);

  const decodedDirPath = dirPath ? decodeURIComponent(dirPath) : '';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fileIdFromUrl = searchParams.get('fileId');
    if (fileIdFromUrl && fileIdFromUrl !== selectedFileId) {
      setSelectedFileId(fileIdFromUrl);
    }
  }, [searchParams, selectedFileId]);

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
      if (isMobile) {
        setLeftDrawerVisible(false);
      }
    }
  };

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (isMobile) {
      setRightDrawerVisible(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const saveCurrentProgress = useCallback(async () => {
    if (!currentProgressRef.current) return;
    
    const { fileId, progress, scrollPosition } = currentProgressRef.current;
    try {
      await updateFileReadingProgress(fileId, progress, scrollPosition);
    } catch (err) {
      console.error('[DirectoryBrowser] 保存进度失败:', err);
    }
  }, []);

  const calculateProgress = useCallback((element: HTMLDivElement): { progress: number; scrollPosition: number } => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
    return { progress: Math.min(100, Math.max(0, progress)), scrollPosition: scrollTop };
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setShowBackTop(target.scrollTop > 200);
    
    if (!selectedFileId) return;
    
    const { progress, scrollPosition } = calculateProgress(target);
    currentProgressRef.current = { fileId: selectedFileId, progress, scrollPosition };
    
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }
    
    saveProgressTimeoutRef.current = setTimeout(() => {
      saveCurrentProgress();
    }, 500);
  }, [selectedFileId, calculateProgress, saveCurrentProgress]);

  const handleBackTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    console.log('[DirectoryBrowser] useEffect 触发, selectedFileId:', selectedFileId);
    
    if (!selectedFileId) {
      console.log('[DirectoryBrowser] selectedFileId 为空，跳过');
      return;
    }
    
    const loadProgressAndRestore = async () => {
      const progressData = await getFileReadingProgress(selectedFileId);
      console.log('[DirectoryBrowser] 进度数据:', progressData, 'contentRef:', contentRef.current);
      
      const doRestore = () => {
        if (contentRef.current) {
          setShowBackTop(false);
          if (progressData?.scrollPosition && progressData.scrollPosition > 0) {
            console.log('[DirectoryBrowser] 恢复滚动位置:', progressData.scrollPosition);
            contentRef.current.scrollTo({ top: progressData.scrollPosition });
          } else {
            console.log('[DirectoryBrowser] 滚动到顶部');
            contentRef.current.scrollTo({ top: 0 });
          }
        } else {
          console.log('[DirectoryBrowser] contentRef 仍为空，重试');
          setTimeout(doRestore, 100);
        }
      };
      
      setTimeout(doRestore, 100);
    };
    
    loadProgressAndRestore();
    
    recordReadingHistory(selectedFileId)
      .catch(err => console.error('[DirectoryBrowser] 阅读历史记录失败:', err));
    
    startTimeRef.current = Date.now();
    currentProgressRef.current = null;
    
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
      
      if (currentProgressRef.current && currentProgressRef.current.fileId === selectedFileId) {
        updateFileReadingProgress(
          currentProgressRef.current.fileId,
          currentProgressRef.current.progress,
          currentProgressRef.current.scrollPosition
        ).catch(err => console.error('[DirectoryBrowser] 保存进度失败:', err));
      }
      
      const endTime = Date.now();
      const readingDuration = Math.round((endTime - startTimeRef.current) / 1000);
      recordReadingHistory(selectedFileId, readingDuration, currentProgressRef.current?.progress)
        .catch(err => console.error('[DirectoryBrowser] 阅读时长记录失败:', err));
    };
  }, [selectedFileId]);

  const headings = selectedFile?.content ? parseMarkdownHeadings(selectedFile.content) : [];
  const headingTree = buildHeadingTree(headings);
  const directoryTree = useMemo(() => buildDirectoryTree(), [directoryFiles, sortBy]);

  const renderDirectoryTree = () => (
    <>
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
    </>
  );

  const renderHeadingTree = () => (
    <>
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
    </>
  );

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

  if (isMobile) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ height: '100vh', position: 'relative' }}>
          <div
            ref={contentRef}
            onScroll={handleScroll}
            style={{ padding: '16px', overflow: 'auto', height: '100%', paddingBottom: 70 }}
          >
            {selectedFile ? (
              <div>
                <h2 style={{ marginBottom: 24 }}>{selectedFile.name}</h2>
                <MarkdownReader file={selectedFile} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Empty description="请选择一个文件查看" />
              </div>
            )}
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
            <Button icon={<HomeOutlined />} onClick={handleBack}>
              返回
            </Button>
            <Button icon={<UnorderedListOutlined />} onClick={() => setLeftDrawerVisible(true)}>
              文件
            </Button>
            {selectedFile && headingTree.length > 0 && (
              <Button icon={<OrderedListOutlined />} onClick={() => setRightDrawerVisible(true)}>
                目录
              </Button>
            )}
          </div>

          {showBackTop && (
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<VerticalAlignTopOutlined />}
              onClick={handleBackTop}
              style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}
            />
          )}
        </Content>

        <Drawer
          title="文件列表"
          placement="left"
          open={leftDrawerVisible}
          onClose={() => setLeftDrawerVisible(false)}
          width={280}
          styles={{ body: { padding: 0 } }}
        >
          {renderDirectoryTree()}
        </Drawer>

        <Drawer
          title="文件目录"
          placement="right"
          open={rightDrawerVisible}
          onClose={() => setRightDrawerVisible(false)}
          width={280}
          styles={{ body: { padding: 0 } }}
        >
          {renderHeadingTree()}
        </Drawer>
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
        {renderDirectoryTree()}
      </Sider>

      <Layout style={{ marginLeft: 260, marginRight: headingTree.length > 0 ? 280 : 0 }}>
        <Content style={{ height: '100vh', position: 'relative' }}>
          <div
            ref={contentRef}
            onScroll={handleScroll}
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
          {renderHeadingTree()}
        </Sider>
      )}
    </Layout>
  );
}
