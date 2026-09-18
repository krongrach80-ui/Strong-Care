from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date, time as dtime
from typing import List, Optional

from app.core.database import get_db
from app.models import Attendance, User
from app.schemas import AttendanceOut

router = APIRouter(prefix='/attendance', tags=['Attendance'])

@router.get('/', response_model=List[AttendanceOut])
async def list_attendance(
    target_date: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Attendance, User.display_name)
        .join(User, Attendance.user_id == User.id)
        .order_by(Attendance.recognized_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    records = []
    for att, display_name in rows:
        records.append(AttendanceOut(
            id=att.id,
            user_id=att.user_id,
            display_name=display_name,
            type=att.type,
            confidence=att.confidence,
            status=att.status,
            recognized_at=att.recognized_at
        ))
    return records

@router.get('/today')
async def today_attendance(db: AsyncSession = Depends(get_db)):
    today_start = datetime.combine(date.today(), dtime.min)
    stmt = (
        select(Attendance, User.display_name)
        .join(User, Attendance.user_id == User.id)
        .where(Attendance.recognized_at >= today_start)
        .order_by(Attendance.recognized_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    records = []
    for att, display_name in rows:
        records.append({
            'id': att.id,
            'user_id': att.user_id,
            'display_name': display_name,
            'type': att.type,
            'confidence': att.confidence,
            'status': att.status,
            'recognized_at': att.recognized_at.strftime('%H:%M:%S')
        })
    return {
        'count': len(records),
        'records': records
    }

@router.get('/export')
async def export_attendance_csv(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Attendance, User.display_name, User.username)
        .join(User, Attendance.user_id == User.id)
        .order_by(Attendance.recognized_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    csv_lines = ['ID,User ID,Username,Display Name,Type,Confidence,Status,Timestamp']
    for att, display_name, username in rows:
        csv_lines.append(f'{att.id},{att.user_id},{username},{display_name},{att.type},{att.confidence:.3f},{att.status},{att.recognized_at.isoformat()}')

    csv_content = '\n'.join(csv_lines)
    return Response(
        content=csv_content,
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename=attendance_{date.today()}.csv'}
    )
