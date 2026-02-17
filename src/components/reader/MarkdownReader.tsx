import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { CodeProps } from 'react-syntax-highlighter/dist/esm/types';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { FileEntity } from '../../types';
import 'katex/dist/katex.min.css';
import './MarkdownReader.css';

interface MarkdownReaderProps {
  file: FileEntity;
}

export default function MarkdownReader({ file }: MarkdownReaderProps) {
  return (
    <div className="markdown-reader">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {file.content}
      </ReactMarkdown>
    </div>
  );
}
