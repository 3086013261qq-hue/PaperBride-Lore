# -*- coding: utf-8 -*-
"""打包整卡：把酒馆卡 JSON 连同立绘嵌入 PNG（tEXt 键 chara + ccv3，兼容 v2/v3 读取器）。

v2 新增：组装守门——自动按段位重排世界书条目数组（清空变量最前、其余按 insertion_order
从大到小 = 阅读顺序）、重编条目 id、并输出格式警告（触发条目缺 key / 条目重名 / 缺 comment）。

用法：
    python 打包整卡.py <整卡.json> [-i 立绘.png] [-o 输出.png]

无 -i 时生成 400x600 深灰纯色占位卡图。输出默认与 JSON 同目录同名 .png。
"""
import argparse
import base64
import io
import json
import os
import struct
import sys
import zlib


def make_placeholder_png(w=400, h=600):
    """纯 stdlib 生成纯色 PNG（无 PIL 依赖）。"""
    raw = b''.join(b'\x00' + b'\x33\x36\x3e' * w for _ in range(h))
    def chunk(ctype, data):
        return struct.pack('>I', len(data)) + ctype + data + struct.pack('>I', zlib.crc32(ctype + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))


def read_chunks(data):
    """校验 PNG 并返回去掉 tEXt/czTt 原有卡数据后的全部 chunk。"""
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        sys.exit('错误：立绘不是有效的 PNG 文件')
    pos, chunks = 8, []
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos + 4])[0]
        ctype = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + length]
        if ctype not in (b'tEXt', b'zTXt') or not body.startswith((b'chara\x00', b'ccv3\x00')):
            chunks.append((ctype, body))  # 保留非卡数据块；旧卡数据块丢弃
        pos += 12 + length
        if ctype == b'IEND':
            break
    return chunks


def build(chunks, payload_b64):
    out = [b'\x89PNG\r\n\x1a\n']
    card_text = [(b'tEXt', b'chara\x00' + payload_b64), (b'tEXt', b'ccv3\x00' + payload_b64)]
    def emit(ctype, body):
        out.append(struct.pack('>I', len(body)) + ctype + body + struct.pack('>I', zlib.crc32(ctype + body) & 0xffffffff))
    inserted = False
    for ctype, body in chunks:
        if not inserted and ctype == b'IDAT':  # 卡数据插在图像块前，读取器秒读
            for t, b in card_text:
                emit(t, b)
            inserted = True
        emit(ctype, body)
    if not inserted:
        for t, b in card_text:
            emit(t, b)
    return b''.join(out)


# ===== 组装守门（v2 新增） =====

def _pos_bucket(e):
    """before_char 的条目排最前；其余（after_char / at_depth）按同一序列排。"""
    return 0 if e.get('position') == 'before_char' else 1


def sort_entries(entries):
    """按阅读顺序重排条目数组：清空变量(before_char)最前，其余按 insertion_order 从大到小。"""
    return sorted(entries, key=lambda e: (_pos_bucket(e), -int(e.get('insertion_order') or 0)))


def validate_entries(entries):
    """输出格式警告（只警告不阻断——内容格式仍需作者自查）。"""
    warns = []
    comments = []
    for e in entries:
        c = (e.get('comment') or '').strip()
        if not c:
            warns.append('有条目缺 comment（条目名）——酒馆列表无法辨认')
        comments.append(c)
        if not e.get('constant') and not (e.get('keys') or []):
            warns.append(f'触发条目缺主要关键字（keys 为空，永不命中）: {c or "<无名>"}')
    dups = sorted({c for c in comments if comments.count(c) > 1})
    if dups:
        warns.append('条目重名: ' + '、'.join(dups))
    for e in entries:
        o = e.get('insertion_order')
        if o is None:
            warns.append(f'条目缺 insertion_order（顺序无保证）: {e.get("comment") or "<无名>"}')
    return warns


def finalize_book(data):
    """对世界书做守门处理：重排数组、重编 id、返回警告列表。"""
    book = data.get('character_book') or {}
    entries = book.get('entries') or []
    if isinstance(entries, dict):  # 原生世界书导出格式兜底
        entries = [entries[k] for k in sorted(entries, key=lambda x: int(x))]
    if not entries:
        return [], 0
    entries = sort_entries(entries)
    for i, e in enumerate(entries, 1):
        e['id'] = i
        if 'enabled' not in e and 'disable' in e:
            e['enabled'] = not e['disable']
    warns = validate_entries(entries)
    book['entries'] = entries
    data['character_book'] = book
    return warns, len(entries)


def main():
    ap = argparse.ArgumentParser(description='把酒馆卡 JSON 嵌入 PNG（自动排序世界书条目）')
    ap.add_argument('json_file', help='整卡 JSON 文件路径')
    ap.add_argument('-i', '--image', help='立绘 PNG（缺省用纯色占位图）')
    ap.add_argument('-o', '--output', help='输出 PNG 路径（缺省与 JSON 同名）')
    args = ap.parse_args()

    with io.open(args.json_file, encoding='utf-8') as f:
        card = json.load(f)
    if 'data' not in card or 'name' not in card.get('data', {}):
        sys.exit('错误：JSON 不像酒馆卡（缺 data.name）——请用整卡组装模板生成的 JSON')

    warns, n = finalize_book(card['data'])

    payload = base64.b64encode(json.dumps(card, ensure_ascii=False).encode('utf-8'))

    img = io.open(args.image, 'rb').read() if args.image else make_placeholder_png()
    png = build(read_chunks(img), payload)

    out = args.output or os.path.splitext(args.json_file)[0] + '.png'
    with io.open(out, 'wb') as f:
        f.write(png)

    entries = card['data'].get('character_book', {}).get('entries', [])
    head = ' → '.join((e.get('comment') or '?') for e in entries[:3])
    tail = ' → '.join((e.get('comment') or '?') for e in entries[-2:])
    print('完成：%s（%.1f KB，内嵌 %d 条世界书，开场白 %d 条）'
          % (out, len(png) / 1024, n, 1 + len(card['data'].get('alternate_greetings', []))))
    print('条目顺序（数组=阅读顺序）: %s … %s' % (head, tail))
    if warns:
        print('⚠ 格式警告 %d 条:' % len(warns))
        for w in warns:
            print('  - ' + w)
    else:
        print('格式检查：无警告')


if __name__ == '__main__':
    main()
