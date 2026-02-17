import { Input, Tree } from 'antd';
import { SearchOutlined, FileOutlined, FolderOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../../hooks/useFiles';
import type { DataNode } from 'antd/es/tree';

const { Search } = Input;

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { files } = useFiles();

  const buildTreeData = (): DataNode[] => {
    if (!files || files.length === 0) return [];

    const treeMap = new Map<string, DataNode>();

    files.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = '';

      parts.forEach((part: any) => {
        const isLast = parts.indexOf(part) === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!treeMap.has(currentPath)) {
          treeMap.set(currentPath, {
            key: currentPath,
            title: part,
            isLeaf: isLast,
            icon: isLast ? <FileOutlined /> : <FolderOutlined />,
          });
        }
      });
    });

    const rootNodes: DataNode[] = [];
    treeMap.forEach(node => {
      const key = node.key as string;
      const lastSlashIndex = key.lastIndexOf('/');
      const parentKey = lastSlashIndex > -1 ? key.substring(0, lastSlashIndex) : null;

      if (parentKey && treeMap.has(parentKey)) {
        const parentNode = treeMap.get(parentKey);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const handleSelect = (_selectedKeys: React.Key[], info: any) => {
    if (info.node.isLeaf) {
      navigate(`/reader/${info.node.key.replace('file_', '')}`);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {!collapsed && (
        <>
          <Search
            placeholder="搜索文件"
            allowClear
            prefix={<SearchOutlined />}
            style={{ marginBottom: 16 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Tree
            showLine
            treeData={buildTreeData()}
            height={window.innerHeight - 150}
            onSelect={handleSelect}
            defaultExpandAll
          />
        </>
      )}
    </div>
  );
}
