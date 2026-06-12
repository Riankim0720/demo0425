import { useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Quote, Code, Minus,
} from 'lucide-react'

export default function EditorToolbar({ editor }) {
  if (!editor) return null

  return (
    <div
      className="flex items-center flex-wrap gap-0.5 px-4 py-1.5"
      style={{ borderBottom: '1px solid #ececea', background: '#fafafa' }}
    >
      <ToolGroup>
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)">
          <Bold size={14} />
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)">
          <Italic size={14} />
        </Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄 (Ctrl+U)">
          <Underline size={14} />
        </Btn>
        <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
          <Strikethrough size={14} />
        </Btn>
        <Btn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="형광펜">
          <Highlighter size={14} />
        </Btn>
      </ToolGroup>

      <Sep />

      <ToolGroup>
        <Btn
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="제목 1"
        >
          <span className="text-[11px] font-bold leading-none">H1</span>
        </Btn>
        <Btn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="제목 2"
        >
          <span className="text-[11px] font-bold leading-none">H2</span>
        </Btn>
        <Btn
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="제목 3"
        >
          <span className="text-[11px] font-bold leading-none">H3</span>
        </Btn>
      </ToolGroup>

      <Sep />

      <ToolGroup>
        <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호">
          <List size={14} />
        </Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 매기기">
          <ListOrdered size={14} />
        </Btn>
        <Btn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="체크리스트">
          <CheckSquare size={14} />
        </Btn>
      </ToolGroup>

      <Sep />

      <ToolGroup>
        <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="왼쪽 정렬">
          <AlignLeft size={14} />
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="가운데 정렬">
          <AlignCenter size={14} />
        </Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="오른쪽 정렬">
          <AlignRight size={14} />
        </Btn>
      </ToolGroup>

      <Sep />

      <ToolGroup>
        <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용">
          <Quote size={14} />
        </Btn>
        <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="인라인 코드">
          <Code size={14} />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
          <Minus size={14} />
        </Btn>
      </ToolGroup>
    </div>
  )
}

function ToolGroup({ children }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function Sep() {
  return <div className="w-px h-5 mx-1" style={{ background: '#e4e4e0' }} />
}

function Btn({ children, active, onClick, title }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
      style={{
        background: active ? '#e8f5ec' : hovered ? '#efefef' : 'transparent',
        color: active ? '#00a82d' : hovered ? '#333' : '#666',
      }}
    >
      {children}
    </button>
  )
}
