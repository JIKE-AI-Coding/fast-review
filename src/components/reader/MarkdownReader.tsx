import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { FileEntity } from '../../types';
import 'katex/dist/katex.min.css';
import './MarkdownReader.css';

interface MarkdownReaderProps {
  file: FileEntity;
}

export default function MarkdownReader({ file }: MarkdownReaderProps) {
  const generateHeadingId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .replace(/--+/g, '-');
  };

  return (
    <div className="markdown-reader">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
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
          h1({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h1 id={id} {...props}>{children}</h1>;
          },
          h2({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h2 id={id} {...props}>{children}</h2>;
          },
          h3({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h3 id={id} {...props}>{children}</h3>;
          },
          h4({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h4 id={id} {...props}>{children}</h4>;
          },
          h5({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h5 id={id} {...props}>{children}</h5>;
          },
          h6({ children, ...props }: any) {
            const text = children?.[0] || '';
            const id = generateHeadingId(text);
            return <h6 id={id} {...props}>{children}</h6>;
          },
        }}
      >
        {file.content}
      </ReactMarkdown>
    </div>
  );
}
