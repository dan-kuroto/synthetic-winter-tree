"""用来制作圆形透明底带边框图片的工具脚本"""
from PIL import Image, ImageDraw

def process_image(input_path, output_path, size, border_size, border_color):
    """
    将图片裁剪为圆形，调整大小，并加边框（边缘抗锯齿）。
    
    :param input_path: 输入图片路径（PNG 格式，正方形）
    :param output_path: 输出图片路径
    :param size: 调整后的图片大小（宽度和高度，单位：像素）
    :param border_size: 边框宽度（单位：像素）
    :param border_color: 边框颜色（例如：(255, 0, 0) 表示红色）
    """
    # 打开图片
    img = Image.open(input_path).convert("RGBA")
    
    # 创建高分辨率掩码用于抗锯齿
    large_size = img.size[0] * 4
    large_mask = Image.new("L", (large_size, large_size), 0)
    large_draw = ImageDraw.Draw(large_mask)
    large_draw.ellipse((0, 0, large_size, large_size), fill=255)

    # 缩小掩码以适应原图并实现抗锯齿效果
    mask = large_mask.resize(img.size, Image.Resampling.LANCZOS)

    # 将图片裁剪为圆形
    img = Image.composite(img, Image.new("RGBA", img.size, (0, 0, 0, 0)), mask)
    
    # 调整大小
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # 创建高分辨率图像用于边框抗锯齿
    final_large_size = (size + 2 * border_size) * 4
    large_bordered_img = Image.new("RGBA", (final_large_size, final_large_size), (0, 0, 0, 0))
    large_draw = ImageDraw.Draw(large_bordered_img)
    
    # 绘制高分辨率边框
    large_draw.ellipse(
        (0, 0, final_large_size - 1, final_large_size - 1),
        fill=border_color
    )
    
    # 缩小边框图像
    final_size = size + 2 * border_size
    bordered_img = large_bordered_img.resize((final_size, final_size), Image.Resampling.LANCZOS)
    
    # 将圆形图片粘贴到带边框的图像中间
    bordered_img.paste(img, (border_size, border_size), img)
    
    # 保存最终图片
    bordered_img.save(output_path, "PNG")


# 示例用法
input_path = "input.png"  # 输入图片路径
output_path = "output.png"  # 输出图片路径
size = 700  # 调整后的图片大小（宽度和高度）
border_size = 5  # 边框宽度
border_color = (0, 0, 0, 255)  # 边框颜色（红色，带透明度）

process_image(input_path, output_path, size, border_size, border_color)
