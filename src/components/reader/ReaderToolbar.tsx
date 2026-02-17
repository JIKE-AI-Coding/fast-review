import { Button, Space, Slider } from 'antd';
import {
  FontSizeOutlined,
  BgColorsOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { FileEntity } from '../../types';

interface ReaderToolbarProps {
  file: FileEntity | null;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onThemeToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export default function ReaderToolbar({
  file,
  fontSize,
  onFontSizeChange,
  onThemeToggle,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: ReaderToolbarProps) {
  return (
    <div className="reader-toolbar">
      <Space>
        <Button
          icon={<LeftOutlined />}
          onClick={onPrevious}
          disabled={!canPrevious}
        >
          上一个
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
        >
          下一个
          <RightOutlined />
        </Button>
      </Space>

      <Space>
        <FontSizeOutlined />
        <Slider
          min={12}
          max={24}
          step={1}
          value={fontSize}
          onChange={onFontSizeChange}
          style={{ width: 150 }}
          tooltip={{ formatter: (value) => `${value}px` }}
        />
      </Space>

      <Space>
        <Button
          icon={<BgColorsOutlined />}
          onClick={onThemeToggle}
        >
          切换主题
        </Button>
      </Space>
    </div>
  );
}
